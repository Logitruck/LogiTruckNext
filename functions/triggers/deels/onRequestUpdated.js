const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');

const db = admin.firestore();

const getFinderUserByVendorID = async (finderVendorID) => {
  if (!finderVendorID) return null;

  const snap = await db
    .collection('vendor_users')
    .doc(finderVendorID)
    .collection('users')
    .where('status', '==', 'active')
    .where('activeRole', '==', 'finder')
    .limit(1)
    .get();

  if (snap.empty) {
    return null;
  }

  const doc = snap.docs[0];
  const data = doc.data() || {};

  return {
    id: data.id || data.userID || doc.id,
    userID: data.userID || doc.id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    fullName:
      data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    email: data.email || '',
    profilePictureURL: data.profilePictureURL || '',
    role: 'finder',
    vendorID: finderVendorID,
  };
};

exports.onRequestUpdated = onDocumentUpdated(
  'requests/{requestID}',
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const requestID = event.params.requestID;

    if (!before || !after) return;

    const previousStatus = before.status;
    const newStatus = after.status;

    const prevContractStatus = before.contract_status;
    const newContractStatus = after.contract_status;

    const confirmedVendor = after.confirmedVendor;
    const createdBy = after.createdBy || null;
    const finderID = after.finderID || createdBy?.vendorID || null;

    const requestRef = db.collection('requests').doc(requestID);

    logger.info(`📌 Update detected on request ${requestID}`);

    if (previousStatus !== newStatus) {
      logger.info(`📡 Status changed: ${previousStatus} → ${newStatus}`);

      switch (newStatus) {
        case 'cancelled':
          try {
            logger.info(
              `🔍 Looking for vendor_requests with requestID ${requestID} to cancel`,
            );

            const snapshot = await db
              .collectionGroup('requests')
              .where('requestID', '==', requestID)
              .get();

            logger.info(
              `📦 Found ${snapshot.size} vendor_requests for cancelled request ${requestID}`,
            );

            if (snapshot.empty) {
              logger.warn(
                `⚠️ No vendor_requests found for cancelled request ${requestID}`,
              );
              break;
            }

            const batch = db.batch();

            snapshot.forEach((docSnap) => {
              const parentVendorID = docSnap.ref.parent.parent?.id;
              if (!parentVendorID) return;

              batch.update(docSnap.ref, {
                status: 'cancelled',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            });

            await batch.commit();
            logger.info(`✅ Vendor requests cancelled for request ${requestID}`);
          } catch (err) {
            logger.error('🔥 Error cancelling vendor_requests:', err);
          }
          break;

        case 'accepted':
          try {
            if (!confirmedVendor || !finderID) {
              logger.error(`❌ Missing confirmedVendor or finderID`);
              return;
            }

            await requestRef.update({
              contract_status: 'preparing_list',
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            await db
              .collection('vendor_requests')
              .doc(confirmedVendor)
              .collection('requests')
              .doc(requestID)
              .update({
                status: 'accepted',
                contract_status: 'waiting_list',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

            logger.info(
              `🔍 Looking for competing vendor_requests for request ${requestID}`,
            );

            const vendorSnapshot = await db
              .collectionGroup('requests')
              .where('requestID', '==', requestID)
              .get();

            logger.info(
              `📦 Found ${vendorSnapshot.size} vendor_requests for accepted request ${requestID}`,
            );

            const batch = db.batch();

            vendorSnapshot.forEach((docSnap) => {
              const vendorID = docSnap.ref.parent.parent?.id;
              if (!vendorID) return;

              if (vendorID !== confirmedVendor) {
                batch.update(docSnap.ref, {
                  status: 'closed',
                  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
              }
            });

            await batch.commit();
            logger.info(
              `✅ Accepted vendor ${confirmedVendor} and closed others`,
            );
          } catch (err) {
            logger.error('🔥 Error processing accepted status:', err);
          }
          break;

        case 'to_sign':
          try {
            if (!confirmedVendor || !finderID) {
              logger.error(`❌ Missing confirmedVendor or finderID`);
              return;
            }

            await db
              .collection('vendor_requests')
              .doc(confirmedVendor)
              .collection('requests')
              .doc(requestID)
              .update({
                status: 'to_sign',
                contract_status: 'to_sign',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });

            logger.info(
              `✅ Documents approved. Request ${requestID} ready to sign`,
            );
          } catch (err) {
            logger.error('🔥 Error processing to_sign status:', err);
          }
          break;

        case 'signed':
          try {
            if (!confirmedVendor || !finderID) {
              logger.error(`❌ Missing confirmedVendor or finderID`);
              return;
            }

            const vendorRequestRef = db
              .collection('vendor_requests')
              .doc(confirmedVendor)
              .collection('requests')
              .doc(requestID);

            const [vendorRequestSnap] = await Promise.all([
              vendorRequestRef.get(),
            ]);

            if (!vendorRequestSnap.exists) {
              logger.error(`❌ vendor_request not found for ${confirmedVendor}/${requestID}`);
              return;
            }

            const vendorRequestData = vendorRequestSnap.data() || {};
            const acceptedOffer = vendorRequestData?.offer || null;

            const matchedRoutes = Array.isArray(vendorRequestData?.matchedRoutes)
              ? vendorRequestData.matchedRoutes
              : [];

            const routeOffers = Array.isArray(acceptedOffer?.routeOffers)
              ? acceptedOffer.routeOffers
              : [];

            const projectRoutes = matchedRoutes.map((route, index) => {
              const relatedRouteOffer =
                routeOffers.find(
                  (routeOffer) => routeOffer?.routeID === route?.id,
                ) || null;

              return {
                id: route?.id || `route_${index + 1}`,
                origin: route?.origin || null,
                destination: route?.destination || null,
                rideType: route?.rideType || null,
                cargo: route?.cargo || null,
                routeSummary: route?.routeSummary || null,
                dieselPrice: route?.dieselPrice ?? null,
                costEstimate: route?.costEstimate ?? null,
                encodedPolyline: route?.routeSummary?.encodedPolyline || null,
                distance: route?.routeSummary?.distance || null,
                duration: route?.routeSummary?.duration || null,
                pickupAlias: "",
                dropoffAlias: "",
                pickupSite: "",
                dropoffSite: "",
                pickupTime: "",
                pickupContact: "",
                dropoffContact: "",
                pickupInstructions: "",
                dropoffInstructions: "",

                pricePerTrip: relatedRouteOffer?.pricePerTrip ?? 0,
                tripsOffered: relatedRouteOffer?.tripsOffered ?? 0,
                notes: relatedRouteOffer?.notes ?? "",
              };
            });

            const totalRoutes = projectRoutes.length;
            const totalTrips =
              acceptedOffer?.totalTrips ??
              projectRoutes.reduce((sum, route) => {
                return sum + Number(route?.tripsOffered || 0);
              }, 0);

            await Promise.all([
              requestRef.update({
                status: 'execution',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              }),
              vendorRequestRef.update({
                status: 'execution',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              }),
            ]);

            const assignedFinder = await getFinderUserByVendorID(finderID);

            if (!assignedFinder) {
              logger.warn(
                `⚠️ No active finder user found for finder vendor ${finderID}. Project will be created without assignedFinder.`,
              );
            }
            const channelID = `${finderID}_${confirmedVendor}`;
            const projectChannelRef = db
              .collection("project_channels")
              .doc(channelID);
            const projectRef = projectChannelRef
              .collection("projects")
              .doc(requestID);

            const companiesParticipants = [
              {
                role: "finder",
                vendorID: finderID,
              },
              {
                role: "carrier",
                vendorID: confirmedVendor,
              },
            ];
            const companiesParticipantIDs = [finderID, confirmedVendor];

            await projectChannelRef.set(
              {
                companiesParticipants,
                companiesParticipantIDs,
                finderID,
                carrierID: confirmedVendor,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );

            await projectRef.set({
              requestID,
              finderID,
              carrierID: confirmedVendor,
              vendorID: confirmedVendor,
              confirmedVendor,
              channelID,
              status: "setup",

              name: "",
              routes: projectRoutes,
              totalRoutes,
              totalTrips,
              acceptedOffer,
              assignedFinder: assignedFinder || null,
              companiesParticipants,
              companiesParticipantIDs,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            await Promise.all([
              requestRef.update({
                executedBy: {
                  role: 'finder',
                  userID: createdBy?.userID || createdBy?.uid || '',
                  vendorID: finderID,
                  email: createdBy?.email ?? '',
                },
                channelID,
              }),
              vendorRequestRef.update({
                executedBy: {
                  role: 'finder',
                  userID: createdBy?.userID || createdBy?.uid || '',
                  vendorID: finderID,
                  email: createdBy?.email ?? '',
                },
                channelID,
              }),
            ]);

            logger.info(
              `🚀 Project ${requestID} started under channel ${channelID} with clean multiroute model`,
              {
                totalRoutes,
                totalTrips,
                hasAcceptedOffer: !!acceptedOffer,
              },
            );
          } catch (err) {
            logger.error('🔥 Error processing signed status:', err);
          }
          break;

        default:
          logger.info(`ℹ️ No action for status: ${newStatus}`);
          break;
      }
    }

    if (prevContractStatus !== newContractStatus) {
      logger.info(
        `📄 Contract status changed: ${prevContractStatus} → ${newContractStatus}`,
      );

      if (!confirmedVendor) {
        logger.warn(`⚠️ Missing confirmedVendor for request ${requestID}`);
        return;
      }

      const vendorRequestRef = db
        .collection('vendor_requests')
        .doc(confirmedVendor)
        .collection('requests')
        .doc(requestID);

      const updateMap = {
        sent_list: 'send_documents',
        review_documents: 'review_documents',
        request_changes: 'review_changes',
      };

      const vendorNewStatus = updateMap[newContractStatus];

      if (vendorNewStatus) {
        await vendorRequestRef.update({
          contract_status: vendorNewStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`✅ Updated carrier contract_status → ${vendorNewStatus}`);
      }
    }
  },
);