const { logger } = require('firebase-functions');
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require('firebase-functions/v2/firestore');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const db = getFirestore();

const addStatusHistory = async ({
  vendorID,
  vehicleID,
  inspectionID,
  statusReport,
  inspectionData,
  authorID,
}) => {
  if (!vendorID || !vehicleID || !inspectionID || !statusReport) {
    return;
  }

  const historyRef = db
    .collection('vendor_vehicles')
    .doc(vendorID)
    .collection('vehicles')
    .doc(vehicleID)
    .collection('inspections')
    .doc(inspectionID)
    .collection('statusHistory')
    .doc();

  await historyRef.set({
    statusReport,
    authorID: authorID || null,
    createdAt: FieldValue.serverTimestamp(),
    source: 'cloud_function',
    vehicleID,
    vehicleType: inspectionData?.vehicleType || null,
    inspectionType: inspectionData?.inspectionType || null,
    inspectionContext: inspectionData?.inspectionContext || null,
    inspectionLocation: inspectionData?.inspectionLocation || null,
    reviewReport: inspectionData?.reviewReport || null,
  });
};

const saveDispatcherInspectionSummary = async ({
  vendorID,
  dispatcherID,
  inspectionID,
  inspectionData,
}) => {
  if (!vendorID || !dispatcherID || !inspectionID) {
    return;
  }

  const dispatcherRef = db
    .collection('carrier_inspections')
    .doc(vendorID)
    .collection('dispatchers')
    .doc(dispatcherID);

  await dispatcherRef.set(
    {
      firstName: inspectionData?.dispatchCarrier?.firstName || '',
      lastName: inspectionData?.dispatchCarrier?.lastName || '',
      email: inspectionData?.dispatchCarrier?.email || '',
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  const summaryRef = dispatcherRef.collection('inspections').doc(inspectionID);

  await summaryRef.set(
    {
      inspectionID,
      reportID: inspectionData?.reportID || null,
      vendorID,

      vehicleID: inspectionData?.vehicleID || null,
      vehicleType: inspectionData?.vehicleType || null,

      inspectionType: inspectionData?.inspectionType || null,
      inspectionContext: inspectionData?.inspectionContext || null,
      operationContext: inspectionData?.operationContext || null,
      inspectionLocation: inspectionData?.inspectionLocation || null,

      jobID: inspectionData?.jobID || null,
      projectID: inspectionData?.projectID || null,
      channelID: inspectionData?.channelID || null,

      driver: inspectionData?.driver || null,
      carrier: inspectionData?.carrier || null,
      dispatchCarrier: inspectionData?.dispatchCarrier || null,

      driverReport: inspectionData?.driverReport || null,
      reviewReport: inspectionData?.reviewReport || null,

      pdfURL: inspectionData?.pdfURL || null,
      statusReport: inspectionData?.statusReport || null,

      updatedByFunction: true,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
};

const updateVehicleInspectionSummary = async ({
  vendorID,
  vehicleID,
  inspectionID,
  inspectionData,
}) => {
  if (!vendorID || !vehicleID || !inspectionID) {
    return;
  }

  const vehicleRef = db
    .collection('vendor_vehicles')
    .doc(vendorID)
    .collection('vehicles')
    .doc(vehicleID);

  const statusReport = inspectionData?.statusReport || null;
  const inspectionType = inspectionData?.inspectionType || null;
  const inspectionContext = inspectionData?.inspectionContext || null;
  const inspectionLocation = inspectionData?.inspectionLocation || null;
  const signedAt = inspectionData?.driverReport?.signedAt || null;
  const signedBy = inspectionData?.driverReport?.signedBy || null;
  const driver =
    inspectionData?.driver ||
    inspectionData?.driverReport?.signedBy ||
    null;

  const reviewReport = inspectionData?.reviewReport || null;
  const canContinueOperation =
    reviewReport?.canContinueOperation ??
    inspectionData?.reviewReport?.canContinueOperation ??
    null;

  const updatePayload = {
    inspectionSummary: {
      inspectionID,
      reportID: inspectionData?.reportID || null,
      vehicleID: inspectionData?.vehicleID || vehicleID,
      vehicleType: inspectionData?.vehicleType || null,

      inspectionType,
      inspectionContext,
      inspectionLocation: inspectionLocation || null,

      statusReport,
      pdfURL: inspectionData?.pdfURL || null,
      lastReportDate: FieldValue.serverTimestamp(),
      lastDriverID:
        driver?.userID || driver?.id || signedBy?.userID || signedBy?.id || null,
      lastDriverName: driver
        ? `${driver?.firstName || ''} ${driver?.lastName || ''}`.trim()
        : '',
      canContinueOperation,
      reviewedAt: reviewReport?.reviewedAt || null,
      signedAt: signedAt || null,
    },

    lastInspectionStatus: statusReport || null,
    lastInspectionDate: FieldValue.serverTimestamp(),
    lastInspectionPDF: inspectionData?.pdfURL || null,
    lastInspectionType: inspectionType || null,
    lastInspectionContext: inspectionContext || null,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (inspectionLocation?.latitude && inspectionLocation?.longitude) {
    updatePayload.currentLocation = {
      latitude: inspectionLocation.latitude,
      longitude: inspectionLocation.longitude,
    };

    updatePayload.lastInspectionLocation = {
      latitude: inspectionLocation.latitude,
      longitude: inspectionLocation.longitude,
    };

    updatePayload.lastUpdatedAt = FieldValue.serverTimestamp();
  }

  if (inspectionType === 'pretrip' && statusReport === 'approved_for_operation') {
    updatePayload.operationSessionOpen = true;
    updatePayload.requiresPretrip = false;
    updatePayload.requiresPosttrip = true;
    updatePayload.operationalStatus =
      canContinueOperation === false ? 'blocked' : 'approved';
  }

  if (inspectionType === 'posttrip') {
    updatePayload.operationSessionOpen = false;
    updatePayload.requiresPretrip = true;
    updatePayload.requiresPosttrip = false;

    if (statusReport === 'approved_for_operation') {
      updatePayload.operationalStatus =
        canContinueOperation === false ? 'blocked' : 'approved';
    }
  }

  if (statusReport === 'blocked_for_operation') {
    updatePayload.operationalStatus = 'blocked';
    updatePayload.requiresPretrip = true;
  }

  await vehicleRef.set(updatePayload, { merge: true });
};

const processInspectionProjection = async ({
  vendorID,
  vehicleID,
  inspectionID,
  inspectionData,
}) => {
  if (!inspectionID) {
    logger.error('❌ Missing inspectionID');
    return;
  }

  if (!inspectionData?.vehicleID || !inspectionData?.vehicleType) {
    logger.error(
      `❌ Inspection ${inspectionID} is missing vehicleID or vehicleType`,
    );
    return;
  }

  if (inspectionData.vehicleID !== vehicleID) {
    logger.warn(
      `⚠️ vehicleID mismatch for inspection ${inspectionID}: path=${vehicleID}, doc=${inspectionData.vehicleID}`,
    );
    return;
  }

  const dispatcherID = inspectionData?.dispatchCarrier?.userID || null;
  const statusReport = inspectionData?.statusReport || null;
  const authorID =
    inspectionData?.driver?.userID ||
    inspectionData?.driver?.id ||
    inspectionData?.driverReport?.signedBy?.userID ||
    null;

  logger.info(
    `📥 Processing inspection projection ${inspectionID} for vendor=${vendorID}, vehicle=${vehicleID}, type=${inspectionData?.vehicleType}, inspectionType=${inspectionData?.inspectionType || 'unknown'}`,
  );

  if (dispatcherID) {
    await saveDispatcherInspectionSummary({
      vendorID,
      dispatcherID,
      inspectionID,
      inspectionData,
    });
  }

  await updateVehicleInspectionSummary({
    vendorID,
    vehicleID,
    inspectionID,
    inspectionData,
  });

  await addStatusHistory({
    vendorID,
    vehicleID,
    inspectionID,
    statusReport,
    inspectionData,
    authorID,
  });

  logger.info(`✅ Inspection projection ${inspectionID} processed`);
};

const onVehicleInspectionCreated = onDocumentCreated(
  'vendor_vehicles/{vendorID}/vehicles/{vehicleID}/inspections/{inspectionID}',
  async event => {
    const { vendorID, vehicleID, inspectionID } = event.params;
    const inspectionData = event.data?.data();

    if (!inspectionData) {
      logger.error(`❌ No data found for inspection ${inspectionID}`);
      return;
    }

    try {
      await processInspectionProjection({
        vendorID,
        vehicleID,
        inspectionID,
        inspectionData,
      });
    } catch (error) {
      logger.error(
        `❌ Error processing created inspection ${inspectionID}:`,
        error,
      );
    }
  },
);

const onVehicleInspectionUpdated = onDocumentUpdated(
  'vendor_vehicles/{vendorID}/vehicles/{vehicleID}/inspections/{inspectionID}',
  async event => {
    const { vendorID, vehicleID, inspectionID } = event.params;
    const inspectionData = event.data?.after?.data();

    if (!inspectionData) {
      logger.error(`❌ No updated data found for inspection ${inspectionID}`);
      return;
    }

    if (inspectionData?.updatedByFunction) {
      logger.info(`🚫 Skipping self-triggered update ${inspectionID}`);
      return;
    }

    try {
      await processInspectionProjection({
        vendorID,
        vehicleID,
        inspectionID,
        inspectionData,
      });
    } catch (error) {
      logger.error(
        `❌ Error processing updated inspection ${inspectionID}:`,
        error,
      );
    }
  },
);

module.exports = {
  onVehicleInspectionCreated,
  onVehicleInspectionUpdated,
};