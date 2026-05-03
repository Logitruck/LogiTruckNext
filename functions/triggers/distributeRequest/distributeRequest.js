const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const haversine = require('../../utils/harversine');

const db = getFirestore();

const onRequestCreated = onDocumentCreated('requests/{requestID}', async (event) => {
  const requestData = event.data?.data();
  const requestID = event.params.requestID;

  if (!requestData) {
    logger.warn('No request data found for event:', requestID);
    return;
  }

  const {
    routes = [],
    createdBy = null,
    finderID = null,
    totalRoutes = 0,
    totalTrips = 0,
    averageDieselPrice = null,
    suggestedPriceRange = null,
    contract_status = 'draft',
    assignmentMode = 'marketplace',
  } = requestData;

  if (!Array.isArray(routes) || routes.length === 0) {
    logger.error('Missing routes array in request:', requestID);
    return;
  }

  if (!finderID) {
    logger.error('Missing finderID in request:', requestID);
    return;
  }

  if (assignmentMode === 'self_assigned' || assignmentMode === 'internal') {
    logger.info(
      `⏭️ Request ${requestID} skipped marketplace distribution due to assignmentMode=${assignmentMode}`,
    );
    return;
  }

  try {
    logger.info(`📡 Distributing multi-route request ${requestID}`, {
      totalRoutes: routes.length,
      totalTrips,
      finderID,
    });

    const vendorSnapshot = await db.collection('vendors').get();

    if (vendorSnapshot.empty) {
      logger.info(`No vendors found for request ${requestID}`);
      return;
    }

    const requestRef = db.collection('requests').doc(requestID);

    for (const vendorDoc of vendorSnapshot.docs) {
      const vendorID = vendorDoc.id;
      const vendorData = vendorDoc.data();
      const vendorCategories = Array.isArray(vendorData?.serviceCategoryIDs)
        ? vendorData.serviceCategoryIDs
        : [];

      if (vendorID === finderID) {
        logger.info(`⏭️ Skipping finder vendor ${vendorID} for request ${requestID}`);
        continue;
      }

      const locationsSnapshot = await db
        .collection('vendor_locations')
        .doc(vendorID)
        .collection('locations')
        .get();

      if (locationsSnapshot.empty) {
        logger.info(`⚠️ Vendor ${vendorID} has no service locations`);
        continue;
      }

      const matchedRoutes = [];

      for (const route of routes) {
        const routeOrigin = route?.origin;
        const routeRideType = route?.rideType;

        if (
          !routeOrigin ||
          routeOrigin.lat == null ||
          routeOrigin.lon == null ||
          !routeRideType?.id
        ) {
          logger.warn(`⚠️ Route missing origin or rideType in request ${requestID}`, {
            vendorID,
            routeID: route?.id || null,
          });
          continue;
        }

        const categoryMatch = vendorCategories.includes(routeRideType.id);
        if (!categoryMatch) continue;

        let routeEligible = false;

        locationsSnapshot.forEach((locDoc) => {
          if (routeEligible) return;

          const locData = locDoc.data();
          const lat = locData?.location?.location?.lat;
          const lng = locData?.location?.location?.lng;
          const maxDistance = locData?.maxDistanceService;

          if (lat != null && lng != null && maxDistance != null) {
            const distance = haversine(routeOrigin.lat, routeOrigin.lon, lat, lng);

            if (distance <= parseFloat(maxDistance)) {
              routeEligible = true;
            }
          }
        });

        if (routeEligible) {
          matchedRoutes.push({
            id: route.id || null,
            origin: route.origin || null,
            destination: route.destination || null,
            rideType: route.rideType || null,
            cargo: route.cargo || null,
            routeSummary: route.routeSummary || null,
            dieselPrice: route.dieselPrice ?? null,
            costEstimate: route.costEstimate ?? null,
            vendors: route.vendors ?? [],
          });
        }
      }

      if (matchedRoutes.length === 0) {
        logger.info(`⏭️ Vendor ${vendorID} skipped for request ${requestID}`, {
          matchedRoutesCount: 0,
        });
        continue;
      }

      await db
        .collection('vendor_requests')
        .doc(vendorID)
        .collection('requests')
        .doc(requestID)
        .set({
          requestID,
          requestRef,

          finderID,
          vendorID,
          createdBy,

          status: 'pending',
          contract_status,

          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),

          totalRoutes: totalRoutes || routes.length,
          totalTrips: totalTrips || 0,
          averageDieselPrice,
          suggestedPriceRange,

          // ✅ paquete completo para UI carrier
          routes: routes.map((route) => ({
            id: route.id || null,
            origin: route.origin || null,
            destination: route.destination || null,
            rideType: route.rideType || null,
            cargo: route.cargo || null,
            routeSummary: route.routeSummary || null,
            dieselPrice: route.dieselPrice ?? null,
            costEstimate: route.costEstimate ?? null,
            vendors: route.vendors ?? [],
          })),

          // ✅ match auxiliar para lógica interna
          matchedRoutesCount: matchedRoutes.length,
          matchedRoutes,

          offer: null,
        });

      logger.info(`✅ Request ${requestID} dispatched to vendor ${vendorID}`, {
        matchedRoutesCount: matchedRoutes.length,
        totalRoutes: routes.length,
      });

      const carrierUsersSnap = await db
        .collection('vendor_users')
        .doc(vendorID)
        .collection('users')
        .where('status', 'in', ['active', 'Active'])
        .get();

      if (carrierUsersSnap.empty) {
        logger.warn(`⚠️ No active users found for vendor ${vendorID}`);
        continue;
      }

      const eligibleUsers = carrierUsersSnap.docs.filter((carrierUserDoc) => {
        const data = carrierUserDoc.data();
        const roles = Array.isArray(data?.rolesArray) ? data.rolesArray : [];
        return roles.includes('carrier') || roles.includes('dispatch');
      });

      if (!eligibleUsers.length) {
        logger.warn(`⚠️ No active Carrier/Dispatch users found for vendor ${vendorID}`);
        continue;
      }

      const { sendPushNotification } = require('../../notifications/utils');

      for (const carrierUserDoc of eligibleUsers) {
        const carrierUserData = carrierUserDoc.data();
        const userID =
          carrierUserData.usersID ||
          carrierUserData.userID ||
          carrierUserDoc.id;

        await sendPushNotification(
          userID,
          'New freight request available',
          `A new freight package with ${routes.length} route(s) is available. Tap to review.`,
          'deal_invitation',
          {
            deeplink: `mychat://deal/${requestID}`,
            requestID,
            vendorID,
            finderID,
            matchedRoutesCount: matchedRoutes.length,
            totalRoutes: routes.length,
          }
        );

        logger.info(`📩 Notification sent to user ${userID} of vendor ${vendorID}`);
      }
    }
  } catch (error) {
    logger.error('🔥 Error distributing request:', error);
  }
});

module.exports = {
  onRequestCreated,
};