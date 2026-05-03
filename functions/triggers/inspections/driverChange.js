const { logger } = require('firebase-functions');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

const handleVehicleDriverChange = async (beforeData, afterData, vendorID, vehicleID) => {
  const previousDriverID = beforeData?.assignedDriverID || null;
  const currentDriverID = afterData?.assignedDriverID || null;

  // Si no cambió, no hacemos nada
  if (previousDriverID === currentDriverID) {
    logger.info(
      `ℹ️ No driver change detected for vehicle ${vehicleID}`,
    );
    return;
  }

  logger.info(
    `🔄 Driver change detected for vehicle ${vehicleID}: ${previousDriverID} -> ${currentDriverID}`,
  );

  const hasOpenDefects = !!afterData?.hasOpenDefects;

  const vehicleRef = db
    .collection('vendor_vehicles')
    .doc(vendorID)
    .collection('vehicles')
    .doc(vehicleID);

  // Si tiene defectos abiertos, sigue en review
  if (hasOpenDefects) {
    await vehicleRef.set(
      {
        operationalStatus: 'review',
        requiresPretrip: false,
        currentAssignedDriverID: currentDriverID,
        lastAssignedDriverID: previousDriverID,
        lastDriverChangeAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    logger.info(
      `⚠️ Vehicle ${vehicleID} remains in review due to open defects after driver change`,
    );
    return;
  }

  // Si no tiene defectos, pasa a pending hasta nueva pretrip
  await vehicleRef.set(
    {
      operationalStatus: 'pending',
      requiresPretrip: true,
      currentAssignedDriverID: currentDriverID,
      lastAssignedDriverID: previousDriverID,
      lastDriverChangeAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  logger.info(
    `✅ Vehicle ${vehicleID} set to pending due to driver change`,
  );
};

const onVehicleAssignedDriverChanged = onDocumentUpdated(
  '/vendor_vehicles/{vendorID}/vehicles/{vehicleID}',
  async (event) => {
    const { vendorID, vehicleID } = event.params;

    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    if (!beforeData || !afterData) {
      logger.warn(`⚠️ Missing before or after data for vehicle ${vehicleID}`);
      return;
    }

    // Evita loops innecesarios si el update vino de función
    if (afterData?.updatedByFunction === true) {
      logger.info(`🚫 Skipping self-triggered update for vehicle ${vehicleID}`);
      return;
    }

    try {
      await handleVehicleDriverChange(
        beforeData,
        afterData,
        vendorID,
        vehicleID,
      );
    } catch (error) {
      logger.error(
        `❌ Error handling assigned driver change for vehicle ${vehicleID}:`,
        error,
      );
    }
  },
);

module.exports = {
  onVehicleAssignedDriverChanged,
};