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
import { db } from '../../../../core/firebase/config';

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
      meta: any = {},
    ) => {
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

        const existingJobSnap = await getDoc(jobRef);
        const existingJobData = existingJobSnap.exists()
          ? existingJobSnap.data()
          : null;

        const previousTruckID = existingJobData?.assignedTruckID || null;
        const previousTrailerID = existingJobData?.assignedTrailerID || null;
        const previousVendorID = existingJobData?.vendorID || null;

        const driver = meta.drivers?.find(
          (item: any) => item.userID === driverID || item.id === driverID,
        );

        const truck = meta.trucks?.find((item: any) => item.id === truckID);

        const trailer = meta.trailers?.find((item: any) => item.id === trailerID);

        const dispatcher = meta.dispatchers?.find(
          (item: any) => item.userID === dispatcherID || item.id === dispatcherID,
        );

        const resolvedVendorID =
          meta?.vendorID ||
          truck?.vendorID ||
          trailer?.vendorID ||
          previousVendorID ||
          null;

        if (resolvedVendorID && previousTruckID && previousTruckID !== truckID) {
          const previousTruckRef = doc(
            db,
            'vendor_vehicles',
            resolvedVendorID,
            'vehicles',
            previousTruckID,
          );

          const previousTruckSnap = await getDoc(previousTruckRef);

          if (previousTruckSnap.exists()) {
            const previousTruckData = previousTruckSnap.data();

            if (previousTruckData?.assignedJobID === jobID) {
              await updateDoc(previousTruckRef, {
                assignedJobID: null,
                assignedJobRef: null,
                currentAssignedDriverID: null,
                assignedDriverID: null,
                liveStatus: 'idle',
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        if (
          resolvedVendorID &&
          previousTrailerID &&
          previousTrailerID !== trailerID
        ) {
          const previousTrailerRef = doc(
            db,
            'vendor_vehicles',
            resolvedVendorID,
            'vehicles',
            previousTrailerID,
          );

          const previousTrailerSnap = await getDoc(previousTrailerRef);

          if (previousTrailerSnap.exists()) {
            const previousTrailerData = previousTrailerSnap.data();

            if (previousTrailerData?.assignedJobID === jobID) {
              await updateDoc(previousTrailerRef, {
                assignedJobID: null,
                assignedJobRef: null,
                currentAssignedDriverID: null,
                assignedDriverID: null,
                liveStatus: 'idle',
                updatedAt: serverTimestamp(),
              });
            }
          }
        }

        const data: any = {
          status: 'assigned',
          assignedDriverID: driverID,
          assignedTruckID: truckID,
          assignedTrailerID: trailerID || null,
          assignedDispatcherID: dispatcherID || null,
          assignedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (driver) {
          data.assignedDriver = {
            id: driver.id,
            userID: driver.userID || driver.usersID || driver.id,
            usersID: driver.usersID || driver.userID || driver.id,
            firstName: driver.firstName || '',
            lastName: driver.lastName || '',
            email: driver.email || '',
            phoneNumber: driver.phoneNumber || '',
          };
        }

        if (truck) {
          data.assignedTruck = {
            id: truck.id,
            vehicleID: truck.vehicleID || truck.id,
            type: truck.type || truck.vehicleType || 'Truck',
            vehicleType: truck.vehicleType || truck.type || 'Truck',
            number: truck.number || '',
            name: truck.name || '',
            licensePlate: truck.licensePlate || '',
            vin: truck.vin || null,
            make: truck.make || null,
            model: truck.model || null,
            year: truck.year || null,
            operationalStatus: truck.operationalStatus || 'pending',
            requiresPretrip: !!truck.requiresPretrip,
            hasOpenDefects: !!truck.hasOpenDefects,
          };
        }

        if (trailer) {
          data.assignedTrailer = {
            id: trailer.id,
            vehicleID: trailer.vehicleID || trailer.id,
            type: trailer.type || trailer.vehicleType || 'Trailer',
            vehicleType: trailer.vehicleType || trailer.type || 'Trailer',
            number: trailer.number || '',
            name: trailer.name || '',
            licensePlate: trailer.licensePlate || '',
            vin: trailer.vin || null,
            make: trailer.make || null,
            model: trailer.model || null,
            year: trailer.year || null,
            operationalStatus: trailer.operationalStatus || 'pending',
            requiresPretrip: !!trailer.requiresPretrip,
            hasOpenDefects: !!trailer.hasOpenDefects,
          };
        }

        if (dispatcher) {
          data.assignedDispatcher = {
            id: dispatcher.id,
            userID: dispatcher.userID || dispatcher.usersID || dispatcher.id,
            usersID: dispatcher.usersID || dispatcher.userID || dispatcher.id,
            firstName: dispatcher.firstName || '',
            lastName: dispatcher.lastName || '',
            email: dispatcher.email || '',
            phoneNumber: dispatcher.phoneNumber || '',
          };
        }

        await updateDoc(jobRef, data);

        if (truckID && resolvedVendorID) {
          const truckRef = doc(
            db,
            'vendor_vehicles',
            resolvedVendorID,
            'vehicles',
            truckID,
          );

          await updateDoc(truckRef, {
            currentAssignedDriverID: driverID,
            assignedDriverID: driverID,
            assignedJobID: jobID,
            assignedJobRef: {
              channelID,
              projectID,
              jobID,
            },
            liveStatus: 'assigned',
            updatedAt: serverTimestamp(),
          });
        }

        if (trailerID && resolvedVendorID) {
          const trailerRef = doc(
            db,
            'vendor_vehicles',
            resolvedVendorID,
            'vehicles',
            trailerID,
          );

          await updateDoc(trailerRef, {
            currentAssignedDriverID: driverID,
            assignedDriverID: driverID,
            assignedJobID: jobID,
            assignedJobRef: {
              channelID,
              projectID,
              jobID,
            },
            liveStatus: 'assigned',
            updatedAt: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error('🔥 Error assigning job with metadata:', error);
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
            currentJobRef: {
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
            currentJobRef: {
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