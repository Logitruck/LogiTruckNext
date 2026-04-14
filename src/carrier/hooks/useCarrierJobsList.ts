import { useEffect, useMemo, useState } from 'react';
import {
  collectionGroup,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type CarrierJobStatus =
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type CarrierJobItem = {
  id: string;
  channelID?: string | null;
  projectID?: string | null;
  projectName?: string | null;
  vendorID?: string | null;
  assignedVendorID?: string | null;
  status?: CarrierJobStatus | string;
  assignedDriverID?: string | null;
  assignedDriverName?: string | null;
  assignedTruckID?: string | null;
  assignedTrailerID?: string | null;
  tripStatus?: string | null;
  origin?: any;
  destination?: any;
  routeSummary?: any;
  currentLocation?: any;
  [key: string]: any;
};

type JobCounters = {
  scheduled: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
};

const INITIAL_COUNTERS: JobCounters = {
  scheduled: 0,
  assigned: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
};

const normalizeStatus = (status?: string | null): CarrierJobStatus | null => {
  if (!status) return null;

  if (
    status === 'scheduled' ||
    status === 'assigned' ||
    status === 'in_progress' ||
    status === 'completed' ||
    status === 'cancelled'
  ) {
    return status;
  }

  return null;
};

const useCarrierJobsList = () => {
  const currentUser = useCurrentUser();

  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [jobs, setJobs] = useState<CarrierJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!vendorID) {
      setJobs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const jobsQuery = query(
      collectionGroup(db, 'jobs'),
      where('vendorID', '==', vendorID),
    );

    const unsubscribe = onSnapshot(
      jobsQuery,
      snapshot => {
        const mappedJobs: CarrierJobItem[] = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const projectRef = docSnap.ref.parent.parent;
          const channelRef = projectRef?.parent?.parent;

          return {
            id: docSnap.id,
            ...data,
            projectID: projectRef?.id || null,
            channelID: channelRef?.id || null,
            projectName:
              data?.projectName ||
              data?.projectTitle ||
              projectRef?.id ||
              null,
          } as CarrierJobItem;
        });

        setJobs(mappedJobs);
        setLoading(false);
      },
      snapshotError => {
        console.error('[useCarrierJobsList] Error:', snapshotError);
        setError(snapshotError);
        setJobs([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorID]);

  const counters = useMemo<JobCounters>(() => {
    return jobs.reduce((acc, job) => {
      const normalizedStatus = normalizeStatus(job?.status);

      if (normalizedStatus) {
        acc[normalizedStatus] += 1;
      }

      return acc;
    }, { ...INITIAL_COUNTERS });
  }, [jobs]);

  return {
    jobs,
    counters,
    loading,
    error,
  };
};

export default useCarrierJobsList;