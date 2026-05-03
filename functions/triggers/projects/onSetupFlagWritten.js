const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

const db = admin.firestore();
const { FieldValue } = admin.firestore;

exports.onSetupFlagWritten = onDocumentWritten(
  'project_channels/{channelID}/projects/{projectID}/setupFlags/{role}',
  async (event) => {
    const { channelID, projectID, role } = event.params;

    const projectRef = db
      .collection('project_channels')
      .doc(channelID)
      .collection('projects')
      .doc(projectID);

    const flagsRef = projectRef.collection('setupFlags');

    try {
      const currentFlag = event.data?.after?.data();

      if (!currentFlag?.done) {
        console.log(`⏳ Role '${role}' has not completed setup yet.`);
        return;
      }

      const otherRole = role === 'finder' ? 'carrier' : 'finder';
      const otherSnap = await flagsRef.doc(otherRole).get();

      if (!otherSnap.exists) {
        console.warn(
          `🕗 Waiting for '${otherRole}' to create setup flag document.`,
        );
        return;
      }

      if (otherSnap.data()?.done !== true) {
        console.warn(
          `🕗 '${otherRole}' setup flag exists but is not marked as done.`,
        );
        return;
      }

      const projectSnap = await projectRef.get();
      const projectData = projectSnap.data();

      if (!projectData) {
        console.warn(`❌ Project data not found for ${projectID}`);
        return;
      }

      const routes = Array.isArray(projectData?.routes)
        ? projectData.routes
        : [];

      const vendorID = projectData?.vendorID || null;
      const finderID = projectData?.finderID || null;

      // A nivel project, esto ya debe ser de compañías, no de usuarios
      const companiesParticipants = Array.isArray(
        projectData?.companiesParticipants,
      )
        ? projectData.companiesParticipants
        : [];

      const companiesParticipantIDs = Array.isArray(
        projectData?.companiesParticipantIDs,
      )
        ? projectData.companiesParticipantIDs
        : [];

      // A nivel job, sí necesitamos personas
      const assignedFinder = projectData?.assignedFinder || null;

      // En este punto inicial del job, si aún no hay driver/dispatcher asignados,
      // el participants real del job arranca con finder, si existe.
      const jobParticipants = assignedFinder ? [assignedFinder] : [];

      const carrierResources = projectData?.carrierResources || {};
      const carrierPersonnel = projectData?.carrierPersonnel || {};
      const carrierAvailability = projectData?.carrierAvailability || {};
      const carrierNotes = projectData?.carrierNotes || '';

      if (!routes.length) {
        console.warn(`⚠️ No routes found for project ${projectID}`);
        return;
      }

      const jobsRef = projectRef.collection('jobs');
      const existingJobsSnap = await jobsRef.get();

      if (!existingJobsSnap.empty) {
        console.warn(
          `⚠️ Jobs already exist for project ${projectID}. Skipping duplicate creation.`,
        );

        await projectRef.update({
          status: 'execution',
          updatedAt: FieldValue.serverTimestamp(),
        });

        return;
      }

      await projectRef.update({
        status: 'execution',
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Project ${projectID} moved to 'execution'`);

      const batch = db.batch();

      routes.forEach((currentRoute, routeIndex) => {
        const tripsForRoute = Number(
          currentRoute?.tripsOffered ?? currentRoute?.cargo?.trips ?? 0,
        );

        if (tripsForRoute <= 0) {
          console.warn(
            `⚠️ Route ${currentRoute?.id || routeIndex} has no trips to generate jobs.`,
          );
          return;
        }

        for (let tripIndex = 1; tripIndex <= tripsForRoute; tripIndex++) {
          const jobDoc = jobsRef.doc();

          batch.set(jobDoc, {
            name: `Route ${routeIndex + 1} - Job ${tripIndex}`,
            status: "pending",
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),

            channelID,
            projectID,
            finderID,
            vendorID,

            // Distinción correcta:
            // project = compañías
            // job = personas

            companiesParticipants,
            companiesParticipantIDs,
            assignedFinder: assignedFinder || null,
            participants: jobParticipants,

            routeID: currentRoute?.id || "",
            routeIndex: routeIndex + 1,
            tripIndex,

            origin: currentRoute?.origin || null,
            destination: currentRoute?.destination || null,
            rideType: currentRoute?.rideType || null,
            cargo: currentRoute?.cargo || null,
            // ✅ Propagación de ruta
            routeSummary: currentRoute?.routeSummary || null,
            encodedPolyline:
              currentRoute?.encodedPolyline ||
              currentRoute?.routeSummary?.encodedPolyline ||
              null,
            distance:
              currentRoute?.distance ??
              currentRoute?.routeSummary?.distance ??
              null,
            duration:
              currentRoute?.duration ??
              currentRoute?.routeSummary?.duration ??
              null,
            dieselPrice: currentRoute?.dieselPrice ?? null,
            costEstimate: currentRoute?.costEstimate ?? null,

            pickupAlias: currentRoute?.pickupAlias || "",
            dropoffAlias: currentRoute?.dropoffAlias || "",
            pickupTime: currentRoute?.pickupTime || "",
            pickupContact: currentRoute?.pickupContact || "",
            dropoffContact: currentRoute?.dropoffContact || "",
            pickupInstructions: currentRoute?.pickupInstructions || "",
            dropoffInstructions: currentRoute?.dropoffInstructions || "",

            pricePerTrip: Number(currentRoute?.pricePerTrip || 0),
            tripsOffered: tripsForRoute,
            notes: currentRoute?.notes || "",

            carrierResources: {
              trucks: Array.isArray(carrierResources?.trucks)
                ? carrierResources.trucks
                : [],
              trailers: Array.isArray(carrierResources?.trailers)
                ? carrierResources.trailers
                : [],
            },

            carrierPersonnel: {
              drivers: Array.isArray(carrierPersonnel?.drivers)
                ? carrierPersonnel.drivers
                : [],
              dispatchers: Array.isArray(carrierPersonnel?.dispatchers)
                ? carrierPersonnel.dispatchers
                : [],
            },

            carrierAvailability: {
              startDate: carrierAvailability?.startDate || null,
              tripsPerDay:
                carrierAvailability?.tripsPerDay != null
                  ? Number(carrierAvailability.tripsPerDay)
                  : null,
            },

            carrierNotes,
          });
        }
      });

      await batch.commit();

      const totalJobs = routes.reduce((sum, currentRoute) => {
        return (
          sum +
          Number(currentRoute?.tripsOffered ?? currentRoute?.cargo?.trips ?? 0)
        );
      }, 0);

      console.log(`📦 Created ${totalJobs} jobs for project ${projectID}`);
    } catch (error) {
      console.error(`❌ Error processing project ${projectID}:`, error);
    }
  },
);