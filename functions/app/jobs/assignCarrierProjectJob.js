const { onCall, HttpsError } = require('firebase-functions/v2/https');
const admin = require('firebase-admin');

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const normalizeParticipant = (item, roleFallback = '') => {
  if (!item) return null;

  const id = item.id || item.userID || item.usersID || item.uid;
  if (!id) return null;

  const firstName = item.firstName || '';
  const lastName = item.lastName || '';

  return {
    id,
    userID: item.userID || item.usersID || id,
    usersID: item.usersID || item.userID || id,
    firstName,
    lastName,
    fullName: item.fullName || `${firstName} ${lastName}`.trim(),
    email: item.email || '',
    phoneNumber: item.phoneNumber || '',
    role: item.role || roleFallback,
  };
};

const dedupeParticipants = (participants = []) => {
  const map = new Map();

  participants.forEach((participant) => {
    if (participant?.id && !map.has(participant.id)) {
      map.set(participant.id, participant);
    }
  });

  return Array.from(map.values());
};

const buildAssignedUser = (user, role) => {
  if (!user) return null;

  return {
    id: user.id,
    userID: user.userID || user.usersID || user.id,
    usersID: user.usersID || user.userID || user.id,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    fullName: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    role,
  };
};

const buildAssignedVehicle = (vehicle, fallbackType) => {
  if (!vehicle) return null;

  return {
    id: vehicle.id,
    vehicleID: vehicle.vehicleID || vehicle.id,
    type: vehicle.type || vehicle.vehicleType || fallbackType,
    vehicleType: vehicle.vehicleType || vehicle.type || fallbackType,
    number: vehicle.number || '',
    name: vehicle.name || '',
    licensePlate: vehicle.licensePlate || '',
    vin: vehicle.vin || null,
    make: vehicle.make || null,
    model: vehicle.model || null,
    year: vehicle.year || null,
    operationalStatus: vehicle.operationalStatus || 'pending',
    requiresPretrip: !!vehicle.requiresPretrip,
    hasOpenDefects: !!vehicle.hasOpenDefects,
  };
};

const buildVehicleOperationalUpdate = ({
  vehicleData,
  nextDriverID,
  previousDriverID,
  channelID,
  projectID,
  jobID,
}) => {
  const hasOpenDefects = !!vehicleData?.hasOpenDefects;

  return {
    currentAssignedDriverID: nextDriverID || null,
    assignedDriverID: nextDriverID || null,
    lastAssignedDriverID: previousDriverID || null,
    lastDriverChangeAt: FieldValue.serverTimestamp(),

    assignedJobID: jobID,
    assignedJobRef: {
      channelID,
      projectID,
      jobID,
    },

    currentJobID: jobID,
    currentJobContext: {
      channelID,
      projectID,
      jobID,
    },

    operationalStatus: hasOpenDefects ? 'review' : 'pending',
    requiresPretrip: hasOpenDefects ? false : true,
    liveStatus: 'assigned',
    updatedAt: FieldValue.serverTimestamp(),
  };
};

exports.assignCarrierProjectJob = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required.');
  }

  const {
    channelID,
    projectID,
    jobID,
    driverID,
    truckID,
    trailerID = '',
    dispatcherID = '',
  } = request.data || {};

  if (!channelID || !projectID || !jobID || !driverID || !truckID) {
    throw new HttpsError(
      'invalid-argument',
      'channelID, projectID, jobID, driverID and truckID are required.',
    );
  }

  const projectRef = db
    .collection('project_channels')
    .doc(channelID)
    .collection('projects')
    .doc(projectID);

  const jobRef = projectRef.collection('jobs').doc(jobID);

  const [projectSnap, jobSnap] = await Promise.all([projectRef.get(), jobRef.get()]);

  if (!projectSnap.exists) {
    throw new HttpsError('not-found', `Project ${projectID} not found.`);
  }

  if (!jobSnap.exists) {
    throw new HttpsError('not-found', `Job ${jobID} not found.`);
  }

  const projectData = projectSnap.data() || {};
  const jobData = jobSnap.data() || {};

  const vendorID =
    jobData.vendorID ||
    projectData.vendorID ||
    projectData.confirmedVendor ||
    null;

  if (!vendorID) {
    throw new HttpsError(
      'failed-precondition',
      `Missing vendorID for job ${jobID}.`,
    );
  }

  const previousTruckID = jobData.assignedTruckID || null;
  const previousTrailerID = jobData.assignedTrailerID || null;
  const previousDriverID = jobData.assignedDriverID || null;

  const driverRef = db
    .collection('vendor_users')
    .doc(vendorID)
    .collection('users')
    .doc(driverID);

  const dispatcherRef = dispatcherID
    ? db.collection('vendor_users').doc(vendorID).collection('users').doc(dispatcherID)
    : null;

  const truckRef = db
    .collection('vendor_vehicles')
    .doc(vendorID)
    .collection('vehicles')
    .doc(truckID);

  const trailerRef = trailerID
    ? db.collection('vendor_vehicles').doc(vendorID).collection('vehicles').doc(trailerID)
    : null;

  const previousTruckRef =
    previousTruckID && previousTruckID !== truckID
      ? db.collection('vendor_vehicles').doc(vendorID).collection('vehicles').doc(previousTruckID)
      : null;

  const previousTrailerRef =
    previousTrailerID && previousTrailerID !== trailerID
      ? db.collection('vendor_vehicles').doc(vendorID).collection('vehicles').doc(previousTrailerID)
      : null;

  const [
    driverSnap,
    dispatcherSnap,
    truckSnap,
    trailerSnap,
    previousTruckSnap,
    previousTrailerSnap,
  ] = await Promise.all([
    driverRef.get(),
    dispatcherRef ? dispatcherRef.get() : Promise.resolve(null),
    truckRef.get(),
    trailerRef ? trailerRef.get() : Promise.resolve(null),
    previousTruckRef ? previousTruckRef.get() : Promise.resolve(null),
    previousTrailerRef ? previousTrailerRef.get() : Promise.resolve(null),
  ]);

  if (!driverSnap.exists) {
    throw new HttpsError('not-found', `Driver ${driverID} not found.`);
  }

  if (!truckSnap.exists) {
    throw new HttpsError('not-found', `Truck ${truckID} not found.`);
  }

  if (dispatcherID && !dispatcherSnap?.exists) {
    throw new HttpsError('not-found', `Dispatcher ${dispatcherID} not found.`);
  }

  if (trailerID && !trailerSnap?.exists) {
    throw new HttpsError('not-found', `Trailer ${trailerID} not found.`);
  }

  const driverData = { id: driverSnap.id, ...(driverSnap.data() || {}) };
  const dispatcherData = dispatcherSnap?.exists
    ? { id: dispatcherSnap.id, ...(dispatcherSnap.data() || {}) }
    : null;
  const truckData = { id: truckSnap.id, ...(truckSnap.data() || {}) };
  const trailerData = trailerSnap?.exists
    ? { id: trailerSnap.id, ...(trailerSnap.data() || {}) }
    : null;

  const assignedFinder = normalizeParticipant(
    jobData.assignedFinder || projectData.assignedFinder,
    'finder',
  );

  const assignedDriver = buildAssignedUser(driverData, 'driver');
  const assignedDispatcher = dispatcherData
    ? buildAssignedUser(dispatcherData, 'dispatch')
    : null;

  const assignedTruck = buildAssignedVehicle(truckData, 'Truck');
  const assignedTrailer = trailerData
    ? buildAssignedVehicle(trailerData, 'Trailer')
    : null;

  const participants = dedupeParticipants(
    [assignedFinder, assignedDispatcher, assignedDriver].filter(Boolean),
  );

  const batch = db.batch();

  if (previousTruckRef && previousTruckSnap?.exists) {
    const previousTruckData = previousTruckSnap.data() || {};
    if (previousTruckData.assignedJobID === jobID) {
      batch.update(previousTruckRef, {
        assignedJobID: null,
        assignedJobRef: null,
        currentJobID: null,
        currentJobContext: null,
        currentAssignedDriverID: null,
        assignedDriverID: null,
        liveStatus: 'idle',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  if (previousTrailerRef && previousTrailerSnap?.exists) {
    const previousTrailerData = previousTrailerSnap.data() || {};
    if (previousTrailerData.assignedJobID === jobID) {
      batch.update(previousTrailerRef, {
        assignedJobID: null,
        assignedJobRef: null,
        currentJobID: null,
        currentJobContext: null,
        currentAssignedDriverID: null,
        assignedDriverID: null,
        liveStatus: 'idle',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
  }

  batch.update(jobRef, {
    status: 'assigned',
    assignedDriverID: driverID,
    assignedTruckID: truckID,
    assignedTrailerID: trailerID || null,
    assignedDispatcherID: dispatcherID || null,
    assignedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),

    assignedFinder: assignedFinder || null,
    assignedDriver: assignedDriver || null,
    assignedDispatcher: assignedDispatcher || null,
    assignedTruck: assignedTruck || null,
    assignedTrailer: assignedTrailer || null,

    participants,
  });

  batch.update(
    truckRef,
    buildVehicleOperationalUpdate({
      vehicleData: truckData,
      nextDriverID: driverID,
      previousDriverID,
      channelID,
      projectID,
      jobID,
    }),
  );

  if (trailerRef && trailerData) {
    batch.update(
      trailerRef,
      buildVehicleOperationalUpdate({
        vehicleData: trailerData,
        nextDriverID: driverID,
        previousDriverID,
        channelID,
        projectID,
        jobID,
      }),
    );
  }

  await batch.commit();

  return {
    success: true,
    message: `Job ${jobID} assigned successfully.`,
    data: {
      channelID,
      projectID,
      jobID,
      vendorID,
      assignedDriverID: driverID,
      assignedTruckID: truckID,
      assignedTrailerID: trailerID || null,
      assignedDispatcherID: dispatcherID || null,
      participantsCount: participants.length,
    },
  };
});