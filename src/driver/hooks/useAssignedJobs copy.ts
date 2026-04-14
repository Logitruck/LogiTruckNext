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
  isValid: boolean;
  validationReason: string;
  truckInspection: {
    operationalStatus?: string | null;
    lastInspectionStatus?: string | null;
    lastInspectionDate?: any;
    lastInspectionPDF?: string | null;
    requiresPretrip?: boolean;
    hasOpenDefects?: boolean;
  } | null;
  [key: string]: any;
};

const isSameDay = (value: any) => {
  if (!value) return false;

  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value?.seconds
        ? new Date(value.seconds * 1000)
        : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
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
      where('status', 'in', ['assigned', 'in_progress']),
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
              const vendorID = jobData?.vendorID || jobData?.assignedVendorID || null;

              let isValid = false;
              let validationReason = 'Missing truck inspection';
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

                    const operationalStatus = truckData?.operationalStatus || null;
                    const lastInspectionStatus =
                      truckData?.lastInspectionStatus || null;
                    const lastInspectionDate =
                      truckData?.lastInspectionDate || null;
                    const lastInspectionPDF =
                      truckData?.lastInspectionPDF || null;
                    const requiresPretrip =
                      truckData?.requiresPretrip ?? true;
                    const hasOpenDefects =
                      truckData?.hasOpenDefects ?? false;

                    const sameDay = isSameDay(lastInspectionDate);

                    isValid =
                      operationalStatus === 'approved' &&
                      sameDay &&
                      !requiresPretrip &&
                      !hasOpenDefects;

                    if (operationalStatus !== 'approved') {
                      validationReason = 'Truck inspection is not approved';
                    } else if (!sameDay) {
                      validationReason = 'Truck inspection is not from today';
                    } else if (requiresPretrip) {
                      validationReason = 'Truck requires pretrip inspection';
                    } else if (hasOpenDefects) {
                      validationReason = 'Truck has open defects';
                    } else {
                      validationReason = '';
                    }

                    truckInspection = {
                      operationalStatus,
                      lastInspectionStatus,
                      lastInspectionDate,
                      lastInspectionPDF,
                      requiresPretrip,
                      hasOpenDefects,
                    };
                  } else {
                    validationReason = 'Truck record not found';
                  }
                }
              } catch (validationErr) {
                console.error('🔥 Error validating vehicle data:', validationErr);
                validationReason = 'Validation error';
              }

              return {
                id: jobId,
                ...jobData,
                projectID: jobDoc.ref.parent.parent?.id || null,
                channelID: jobDoc.ref.parent.parent?.parent?.parent?.id || null,
                isValid,
                validationReason,
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