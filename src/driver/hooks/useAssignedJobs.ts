import { useEffect, useState } from 'react';
import {
  collectionGroup,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';

type InspectionSummary = {
  inspectionID?: string;
  reportID?: string;
  pairedVehicleID?: string | null;
  statusReport?: string | null;
  lastReportDate?: any;
  pdfURL?: string | null;
  canContinueOperation?: boolean | null;
  lastDriverID?: string | null;
  reviewedAt?: any;
  vehicleType?: 'Truck' | 'Trailer';
};

type AssignedJob = {
  id: string;
  projectID?: string | null;
  channelID?: string | null;
  assignedTruckID?: string | null;
  assignedTrailerID?: string | null;
  assignedDriverID?: string | null;
  vendorID?: string | null;
  status?: string;
  tripStatus?: string;

  canStartJob: boolean;
  validationReason: string;
  inspectionStatusLabel: string;
  inspectionStatusColor: 'green' | 'orange' | 'red' | 'gray';

truckInspection: {
  inspectionSummary?: InspectionSummary | null;
  statusReport?: string | null;
  lastInspectionDate?: any;
  lastInspectionPDF?: string | null;
  lastDriverID?: string | null;

  requiresPretrip?: boolean;
  operationSessionOpen?: boolean;
  lastInspectionType?: 'pretrip' | 'posttrip' | null;
  lastInspectionContext?: 'job' | 'standalone' | null;
} | null;

  [key: string]: any;
};

const resolveDate = (value: any): Date | null => {
  if (!value) return null;

  const resolved =
    value?.toDate?.() ||
    (value?.seconds ? new Date(value.seconds * 1000) : new Date(value));

  if (Number.isNaN(resolved.getTime())) {
    return null;
  }

  return resolved;
};

const isSameDay = (value: any) => {
  const date = resolveDate(value);
  if (!date) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const getInspectionValidation = (
  inspectionSummary?: InspectionSummary | null,
  vehicleData?: any,
  currentDriverID?: string | null,
) => {
  if (!vehicleData) {
    return {
      canStartJob: false,
      validationReason: 'Vehicle not found',
      inspectionStatusLabel: 'Vehicle not found',
      inspectionStatusColor: 'gray' as const,
    };
  }

  // 🔹 NUEVO: validar estado operativo del vehículo
  const requiresPretrip = vehicleData?.requiresPretrip ?? true;
  const operationSessionOpen = vehicleData?.operationSessionOpen ?? false;

  if (requiresPretrip) {
    return {
      canStartJob: false,
      validationReason: 'Pre-trip inspection required',
      inspectionStatusLabel: 'Pre-trip required',
      inspectionStatusColor: 'orange' as const,
    };
  }

  if (!operationSessionOpen) {
    return {
      canStartJob: false,
      validationReason: 'Operation not started',
      inspectionStatusLabel: 'Operation not started',
      inspectionStatusColor: 'orange' as const,
    };
  }

  // 🔹 fallback a summary (para trazabilidad)
  if (!inspectionSummary) {
    return {
      canStartJob: false,
      validationReason: 'No inspection summary',
      inspectionStatusLabel: 'No inspection',
      inspectionStatusColor: 'gray' as const,
    };
  }

  if (inspectionSummary.statusReport !== 'approved_for_operation') {
    return {
      canStartJob: false,
      validationReason: 'Inspection not approved',
      inspectionStatusLabel: 'Not approved',
      inspectionStatusColor: 'orange' as const,
    };
  }

  if (!isSameDay(inspectionSummary.lastReportDate)) {
    return {
      canStartJob: false,
      validationReason: 'Inspection not from today',
      inspectionStatusLabel: 'Not from today',
      inspectionStatusColor: 'orange' as const,
    };
  }

  if (!currentDriverID || inspectionSummary.lastDriverID !== currentDriverID) {
    return {
      canStartJob: false,
      validationReason: 'Different driver',
      inspectionStatusLabel: 'Different driver',
      inspectionStatusColor: 'orange' as const,
    };
  }

  return {
    canStartJob: true,
    validationReason: '',
    inspectionStatusLabel: 'Ready to start',
    inspectionStatusColor: 'green' as const,
  };
};

const useAssignedJobs = (driverID?: string | null) => {
  const [assignedJobs, setAssignedJobs] = useState<AssignedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!driverID) {
      setAssignedJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const jobsQuery = query(
      collectionGroup(db, 'jobs'),
      where('assignedDriverID', '==', driverID),
      where('status', 'in', ['scheduled', 'assigned', 'in_progress']),
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      async snapshot => {
        try {
          const jobsWithValidation = await Promise.all(
            snapshot.docs.map(async jobDoc => {
              const jobData = jobDoc.data();
              const jobId = jobDoc.id;
              const assignedTruckID = jobData?.assignedTruckID || null;
              const vendorID =
                jobData?.vendorID || jobData?.assignedVendorID || null;

              let canStartJob = false;
              let validationReason = 'No inspection submitted';
              let inspectionStatusLabel = 'No inspection submitted';
              let inspectionStatusColor: AssignedJob['inspectionStatusColor'] =
                'gray';
              let truckInspection: AssignedJob['truckInspection'] = null;

              try {
                if (assignedTruckID && vendorID) {
                  const truckRef = doc(
                    db,
                    'vendor_vehicles',
                    vendorID,
                    'vehicles',
                    assignedTruckID,
                  );

                  const truckSnap = await getDoc(truckRef);

                  if (truckSnap.exists()) {
                    const truckData = truckSnap.data();
                    const inspectionSummary: InspectionSummary | null =
                      truckData?.inspectionSummary || null;

                    const validation = getInspectionValidation(
                      inspectionSummary,
                      truckData, // 🔥 NUEVO
                      driverID,
                    );

                    canStartJob = validation.canStartJob;
                    validationReason = validation.validationReason;
                    inspectionStatusLabel = validation.inspectionStatusLabel;
                    inspectionStatusColor = validation.inspectionStatusColor;

                    truckInspection = {
                      inspectionSummary,
                      statusReport: inspectionSummary?.statusReport || null,
                      lastInspectionDate:
                        inspectionSummary?.lastReportDate || null,
                      lastInspectionPDF: inspectionSummary?.pdfURL || null,
                      lastDriverID: inspectionSummary?.lastDriverID || null,

                      // 🔥 NUEVO
                      requiresPretrip: truckData?.requiresPretrip ?? true,
                      operationSessionOpen:
                        truckData?.operationSessionOpen ?? false,
                      lastInspectionType: truckData?.lastInspectionType || null,
                      lastInspectionContext:
                        truckData?.lastInspectionContext || null,
                    };
                  } else {
                    validationReason = "Truck record not found";
                    inspectionStatusLabel = "Truck record not found";
                    inspectionStatusColor = "gray";
                  }
                }
              } catch (validationErr) {
                console.error('🔥 Error validating vehicle data:', validationErr);
                validationReason = 'Validation error';
                inspectionStatusLabel = 'Validation error';
                inspectionStatusColor = 'red';
              }

              return {
                id: jobId,
                ...jobData,
                projectID: jobDoc.ref.parent.parent?.id || null,
                channelID: jobDoc.ref.parent.parent?.parent?.parent?.id || null,
                canStartJob,
                validationReason,
                inspectionStatusLabel,
                inspectionStatusColor,
                truckInspection,
              } as AssignedJob;
            }),
          );

          setAssignedJobs(jobsWithValidation);
          setLoading(false);
        } catch (snapshotErr) {
          console.error('🔥 Error processing assigned jobs:', snapshotErr);
          setError(snapshotErr);
          setAssignedJobs([]);
          setLoading(false);
        }
      },
      snapshotErr => {
        console.error('🔥 Error fetching assigned jobs:', snapshotErr);
        setError(snapshotErr);
        setAssignedJobs([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [driverID]);

  return {
    assignedJobs,
    loading,
    error,
  };
};

export default useAssignedJobs;