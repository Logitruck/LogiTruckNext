import { useEffect, useState } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';

type ActiveJobRef = {
  jobID?: string;
  projectID?: string;
  channelID?: string;
  [key: string]: any;
};

type UseDriverAssignedVehiclesParams = {
  userID?: string;
  activeJob?: ActiveJobRef | string | null;
  vendorID?: string | null;
};

type JobItem = {
  id: string;
  vendorID?: string;
  assignedVendorID?: string;
  assignedDriverID?: string;
  assignedTruckID?: string;
  assignedTrailerID?: string;
  assignedDispatcher?: any;
  assignedDispatcherID?: string;
  status?: 'scheduled' | 'assigned' | 'in_progress' | 'completed' | string;
  [key: string]: any;
};

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
  inspectionType?: 'pretrip' | 'posttrip' | null;
  inspectionContext?: 'job' | 'standalone' | null;
  inspectionLocation?: {
    latitude: number;
    longitude: number;
  } | null;
};

type VehicleItem = {
  id: string;
  vehicleID: string;
  type: 'Truck' | 'Trailer';
  inspectionSummary?: InspectionSummary | null;
  statusReport?: string | null;
  lastReportDate?: any;
  lastInspectionPDF?: string | null;
  lastInspectionReportId?: string | null;
  canContinueOperation?: boolean | null;
  isValid?: boolean;
  validationReason?: string;

  requiresPretrip?: boolean;
  requiresPosttrip?: boolean;
  operationSessionOpen?: boolean;
  lastInspectionType?: 'pretrip' | 'posttrip' | null;
  lastInspectionContext?: 'job' | 'standalone' | null;
  lastInspectionLocation?: {
    latitude: number;
    longitude: number;
  } | null;

  dispatch?: any;
  dispatchID?: string | null;
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
      isValid: false,
      validationReason: 'Vehicle not found',
    };
  }

  const requiresPretrip = vehicleData?.requiresPretrip ?? true;
  const operationSessionOpen = vehicleData?.operationSessionOpen ?? false;
  const lastInspectionType = vehicleData?.lastInspectionType || null;

  if (requiresPretrip) {
    return {
      isValid: false,
      validationReason: 'Pre-trip inspection required',
    };
  }

  if (!operationSessionOpen) {
    return {
      isValid: false,
      validationReason: 'Operation session is not open',
    };
  }

  if (!inspectionSummary) {
    return {
      isValid: false,
      validationReason: 'No inspection submitted',
    };
  }

  if (inspectionSummary.statusReport !== 'approved_for_operation') {
    return {
      isValid: false,
      validationReason: 'Inspection is not approved for operation',
    };
  }

  if (lastInspectionType !== 'pretrip') {
    return {
      isValid: false,
      validationReason: 'Last valid inspection is not a pre-trip',
    };
  }

  if (!isSameDay(inspectionSummary.lastReportDate)) {
    return {
      isValid: false,
      validationReason: 'Inspection is not from today',
    };
  }

  if (!currentDriverID || inspectionSummary.lastDriverID !== currentDriverID) {
    return {
      isValid: false,
      validationReason: 'Inspection was completed by another driver',
    };
  }

  return {
    isValid: true,
    validationReason: '',
  };
};

const useDriverAssignedVehicles = ({
  userID,
  activeJob,
  vendorID: externalVendorID = null,
}: UseDriverAssignedVehiclesParams) => {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!userID) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);

        let resolvedVendorID = externalVendorID || null;
        let jobs: JobItem[] = [];

        const activeJobObject =
          activeJob && typeof activeJob === 'object' ? activeJob : null;

        if (
          activeJobObject?.channelID &&
          activeJobObject?.projectID &&
          activeJobObject?.jobID
        ) {
          const jobRef = doc(
            db,
            'project_channels',
            activeJobObject.channelID,
            'projects',
            activeJobObject.projectID,
            'jobs',
            activeJobObject.jobID,
          );

          const jobSnap = await getDoc(jobRef);

          if (jobSnap.exists()) {
            const jobData: JobItem = {
              id: jobSnap.id,
              ...(jobSnap.data() as Omit<JobItem, 'id'>),
            };

            jobs = [jobData];

            if (!resolvedVendorID) {
              resolvedVendorID =
                jobData.vendorID || jobData.assignedVendorID || null;
            }
          }
        }

        if (!jobs.length) {
          const jobsQuery = query(
            collectionGroup(db, 'jobs'),
            where('assignedDriverID', '==', userID),
            where('status', 'in', ['scheduled', 'assigned', 'in_progress']),
          );

          const jobsSnap = await getDocs(jobsQuery);

          jobs = jobsSnap.docs.map(
            (jobDoc): JobItem => ({
              id: jobDoc.id,
              ...(jobDoc.data() as Omit<JobItem, 'id'>),
            }),
          );

          if (!resolvedVendorID && jobs.length > 0) {
            resolvedVendorID =
              jobs[0].vendorID || jobs[0].assignedVendorID || null;
          }
        }

        if (!resolvedVendorID) {
          setVehicles([]);
          setLoading(false);
          return;
        }

        const truckIDs = new Set<string>();
        const trailerIDs = new Set<string>();
        const vehicleDispatchMap: Record<
          string,
          { dispatch?: any; dispatchID?: string | null }
        > = {};

        jobs.forEach(job => {
          const dispatch = job.assignedDispatcher || null;
          const dispatchID = job.assignedDispatcherID || null;

          if (job.assignedTruckID) {
            truckIDs.add(job.assignedTruckID);
            vehicleDispatchMap[job.assignedTruckID] = { dispatch, dispatchID };
          }

          if (job.assignedTrailerID) {
            trailerIDs.add(job.assignedTrailerID);
            vehicleDispatchMap[job.assignedTrailerID] = { dispatch, dispatchID };
          }
        });

        const vehicleIDs = [...truckIDs, ...trailerIDs];

        if (!vehicleIDs.length) {
          setVehicles([]);
          setLoading(false);
          return;
        }

        const chunks: string[][] = [];
        for (let i = 0; i < vehicleIDs.length; i += 10) {
          chunks.push(vehicleIDs.slice(i, i + 10));
        }

        const allVehicles: VehicleItem[] = [];

        for (const chunk of chunks) {
          const vehiclesRef = collection(
            db,
            'vendor_vehicles',
            resolvedVendorID,
            'vehicles',
          );

          const vehiclesQuery = query(
            vehiclesRef,
            where(documentId(), 'in', chunk),
          );

          const vehicleSnap = await getDocs(vehiclesQuery);

          vehicleSnap.docs.forEach(vehicleDoc => {
            const data = vehicleDoc.data();
            const vehicleID = vehicleDoc.id;

            const inspectionSummary: InspectionSummary | null =
              data?.inspectionSummary || null;

            const validation = getInspectionValidation(
              inspectionSummary,
              data,
              userID,
            );

            allVehicles.push({
              ...data,
              id: vehicleID,
              vehicleID,
              type: truckIDs.has(vehicleID) ? 'Truck' : 'Trailer',

              inspectionSummary,
              statusReport: inspectionSummary?.statusReport || null,
              lastReportDate: inspectionSummary?.lastReportDate || null,
              lastInspectionPDF: inspectionSummary?.pdfURL || null,
              lastInspectionReportId: inspectionSummary?.inspectionID || null,
              canContinueOperation:
                inspectionSummary?.canContinueOperation ?? null,

              isValid: validation.isValid,
              validationReason: validation.validationReason,

              requiresPretrip: data?.requiresPretrip ?? true,
              requiresPosttrip: data?.requiresPosttrip ?? false,
              operationSessionOpen: data?.operationSessionOpen ?? false,
              lastInspectionType: data?.lastInspectionType || null,
              lastInspectionContext: data?.lastInspectionContext || null,
              lastInspectionLocation: data?.lastInspectionLocation || null,

              ...vehicleDispatchMap[vehicleID],
            } as VehicleItem);
          });
        }

        setVehicles(allVehicles);
      } catch (err) {
        console.error('🔥 Error in useDriverAssignedVehicles:', err);
        setError(err);
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [userID, activeJob, externalVendorID]);

  return {
    vehicles,
    loading,
    error,
  };
};

export default useDriverAssignedVehicles;