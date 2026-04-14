import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';

type JobCounters = {
  pending: number;
  scheduled: number;
  assigned: number;
  in_progress: number;
  completed: number;
  cancelled: number;
};

const initialCounters: JobCounters = {
  pending: 0,
  scheduled: 0,
  assigned: 0,
  in_progress: 0,
  completed: 0,
  cancelled: 0,
};

const useFinderProjectJobs = (channelID?: string, projectID?: string) => {
  const currentUser = useCurrentUser();
  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState<JobCounters>(initialCounters);

  useEffect(() => {
    if (!channelID || !projectID || !finderID) {
      setJobs([]);
      setCounters(initialCounters);
      setLoading(false);
      return;
    }

    let unsubscribeJobs: null | (() => void) = null;

    const setup = async () => {
      try {
        setLoading(true);

        const projectRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
        );

        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          setJobs([]);
          setCounters(initialCounters);
          setLoading(false);
          return;
        }

        const projectData = projectSnap.data();

        if (projectData?.finderID !== finderID) {
          console.error('🔥 Unauthorized access to finder project jobs');
          setJobs([]);
          setCounters(initialCounters);
          setLoading(false);
          return;
        }

        const jobsRef = collection(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
          'jobs',
        );

        const jobsQuery = query(jobsRef);

        unsubscribeJobs = onSnapshot(
          jobsQuery,
          (snapshot) => {
            const docs = snapshot.docs
              .map((snapshotDoc) => ({
                id: snapshotDoc.id,
                channelID,
                projectID,
                ...snapshotDoc.data(),
              }))
              .sort((a: any, b: any) => {
                const aRoute = Number(a.routeIndex || 0);
                const bRoute = Number(b.routeIndex || 0);

                if (aRoute !== bRoute) {
                  return aRoute - bRoute;
                }

                const aTrip = Number(a.tripIndex || 0);
                const bTrip = Number(b.tripIndex || 0);

                return aTrip - bTrip;
              });

            setJobs(docs);
            setLoading(false);

            const counts: JobCounters = {
              pending: 0,
              scheduled: 0,
              assigned: 0,
              in_progress: 0,
              completed: 0,
              cancelled: 0,
            };

            docs.forEach((job: any) => {
              if (counts[job.status as keyof JobCounters] !== undefined) {
                counts[job.status as keyof JobCounters] += 1;
              }
            });

            setCounters(counts);
          },
          (error) => {
            console.error('🔥 Error fetching finder jobs:', error);
            setLoading(false);
          },
        );
      } catch (error) {
        console.error('🔥 Error validating finder project jobs:', error);
        setJobs([]);
        setCounters(initialCounters);
        setLoading(false);
      }
    };

    setup();

    return () => {
      unsubscribeJobs?.();
    };
  }, [channelID, projectID, finderID]);

  const scheduleJob = useCallback(
    async (jobID: string, date: Date, notes = '') => {
      if (!channelID || !projectID) {
        throw new Error('Missing channelID or projectID');
      }

      if (!finderID) {
        throw new Error('Missing finder vendorID');
      }

      try {
        const projectRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
        );

        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          throw new Error('Project not found');
        }

        const projectData = projectSnap.data();

        if (projectData?.finderID !== finderID) {
          throw new Error('Unauthorized action');
        }

        const jobRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
          'jobs',
          jobID,
        );

        await updateDoc(jobRef, {
          status: 'scheduled',
          scheduledAt: date,
          notes,
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        console.error('🔥 Error scheduling job:', error);
        throw error;
      }
    },
    [channelID, projectID, finderID],
  );

  return {
    jobs,
    loading,
    counters,
    scheduleJob,
  };
};

export default useFinderProjectJobs;