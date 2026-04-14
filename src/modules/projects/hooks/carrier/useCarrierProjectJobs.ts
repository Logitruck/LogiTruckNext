import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../../../core/firebase/config';

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

const useCarrierProjectJobs = (channelID?: string, projectID?: string) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState<JobCounters>(initialCounters);

  useEffect(() => {
    if (!channelID || !projectID) {
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

    const unsubscribe = onSnapshot(
      jobsQuery,
      snapshot => {
        const docs = snapshot.docs
          .map(snapshotDoc => ({
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
      error => {
        console.error('🔥 Error fetching carrier jobs:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [channelID, projectID]);

  const scheduleJob = useCallback(
    async (jobID: string, date: Date, notes = '') => {
      if (!channelID || !projectID) {
        throw new Error('Missing channelID or projectID');
      }

      try {
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
    [channelID, projectID],
  );

  const assignJob = useCallback(
    async (
      jobID: string,
      driverID: string,
      truckID: string,
      trailerID = '',
      dispatcherID = '',
    ) => {
      if (!channelID || !projectID) {
        throw new Error('Missing channelID or projectID');
      }

      try {
        const callable = httpsCallable(functions, 'assignCarrierProjectJob');

        const result: any = await callable({
          channelID,
          projectID,
          jobID,
          driverID,
          truckID,
          trailerID,
          dispatcherID,
        });

        return result?.data;
      } catch (error) {
        console.error('🔥 Error assigning job:', error);
        throw error;
      }
    },
    [channelID, projectID],
  );

  const startJob = useCallback(
    async (
      jobChannelID: string,
      jobProjectID: string,
      jobID: string,
      driverID: string,
    ) => {
      try {
        const jobRef = doc(
          db,
          'project_channels',
          jobChannelID,
          'projects',
          jobProjectID,
          'jobs',
          jobID,
        );

        const jobSnap = await getDoc(jobRef);

        if (!jobSnap.exists()) {
          throw new Error('Job not found');
        }

        const jobData = jobSnap.data();
        const assignedTruckID = jobData?.assignedTruckID || null;
        const assignedTrailerID = jobData?.assignedTrailerID || null;
        const vendorID = jobData?.vendorID || null;

        await updateDoc(jobRef, {
          status: 'in_progress',
          tripStatus: 'in_progress',
          startedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedByFunction: true,
        });

        if (driverID) {
          const userRef = doc(db, 'users', driverID);

          await updateDoc(userRef, {
            activeJob: {
              jobID,
              projectID: jobProjectID,
              channelID: jobChannelID,
            },
            updatedAt: serverTimestamp(),
          });
        }

        if (vendorID && assignedTruckID) {
          const truckRef = doc(
            db,
            'vendor_vehicles',
            vendorID,
            'vehicles',
            assignedTruckID,
          );

          await updateDoc(truckRef, {
            currentJobID: jobID,
            currentJobContext: {
              channelID: jobChannelID,
              projectID: jobProjectID,
              jobID,
            },
            currentDriverID: driverID,
            liveStatus: 'in_progress',
            updatedAt: serverTimestamp(),
          });
        }

        if (vendorID && assignedTrailerID) {
          const trailerRef = doc(
            db,
            'vendor_vehicles',
            vendorID,
            'vehicles',
            assignedTrailerID,
          );

          await updateDoc(trailerRef, {
            currentJobID: jobID,
            currentJobContext: {
              channelID: jobChannelID,
              projectID: jobProjectID,
              jobID,
            },
            currentDriverID: driverID,
            liveStatus: 'in_progress',
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('🔥 Error starting job:', error);
        throw error;
      }
    },
    [],
  );

  return {
    jobs,
    loading,
    counters,
    scheduleJob,
    assignJob,
    startJob,
  };
};

export default useCarrierProjectJobs;