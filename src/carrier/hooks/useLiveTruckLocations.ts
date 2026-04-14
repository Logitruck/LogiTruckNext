import { useEffect, useState } from 'react';
import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type LiveTruckLocationItem = {
  id: string;
  name?: string | null;
  number?: string | null;
  licensePlate?: string | null;
  currentLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  lastUpdatedAt?: any;
  vehicle?: any;
  currentJobID?: string | null;
  currentJobRef?: {
    channelID?: string | null;
    projectID?: string | null;
    jobID?: string | null;
  } | null;
  currentDriverID?: string | null;
  currentDriverName?: string | null;
  tripStatus?: string | null;
  job?: any;
  vendorID?: string | null;
};

type HydratedJob = {
  id: string;
  channelID?: string | null;
  projectID?: string | null;
  tripStatus?: string | null;
  status?: string | null;
  destination?: any;
  [key: string]: any;
};

const buildDriverName = (userData: any) => {
  const fullName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim();

  return (
    fullName ||
    userData?.displayName ||
    userData?.userName ||
    userData?.email ||
    null
  );
};

const normalizeVehicleLocation = (
  vehicleID: string,
  data: any,
): LiveTruckLocationItem => {
  return {
    id: vehicleID,
    name: data?.name || null,
    number: data?.number || null,
    licensePlate: data?.licensePlate || data?.plate || null,
    currentLocation:
      typeof data?.currentLocation?.latitude === 'number' &&
      typeof data?.currentLocation?.longitude === 'number'
        ? {
            latitude: data.currentLocation.latitude,
            longitude: data.currentLocation.longitude,
          }
        : typeof data?.lastLocation?.latitude === 'number' &&
          typeof data?.lastLocation?.longitude === 'number'
        ? {
            latitude: data.lastLocation.latitude,
            longitude: data.lastLocation.longitude,
          }
        : null,
    lastUpdatedAt:
      data?.lastUpdatedAt ||
      data?.lastLocationUpdatedAt ||
      data?.updatedAt ||
      null,
    currentJobID: data?.currentJobID || data?.activeJobID || null,
    currentJobRef: data?.currentJobRef || null,
    currentDriverID: data?.currentDriverID || data?.assignedDriverID || null,
    vendorID: data?.vendorID || null,
    vehicle: {
      id: vehicleID,
      ...data,
    },
  };
};

const useLiveTruckLocations = () => {
  const currentUser = useCurrentUser();
  const vendorID =
    currentUser?.activeVendorID || currentUser?.vendorID || null;

  const [truckLocations, setTruckLocations] = useState<LiveTruckLocationItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!vendorID) {
      setTruckLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const vehiclesRef = collection(db, 'vendor_vehicles', vendorID, 'vehicles');

    const vehiclesQuery = query(vehiclesRef, where('type', '==', 'Truck'));

    const unsubscribe = onSnapshot(
      vehiclesQuery,
      async snapshot => {
        try {
          const baseTrucks = snapshot.docs.map(docSnap =>
            normalizeVehicleLocation(docSnap.id, docSnap.data()),
          );

          const hydratedTrucks = await Promise.all(
            baseTrucks.map(async truck => {
              let hydratedJob: HydratedJob | null = null;
              let tripStatus: string | null = null;
              let currentDriverName: string | null = null;

              try {
                if (
                  truck?.currentJobRef?.channelID &&
                  truck?.currentJobRef?.projectID &&
                  truck?.currentJobRef?.jobID
                ) {
                  const jobRef = doc(
                    db,
                    'project_channels',
                    truck.currentJobRef.channelID,
                    'projects',
                    truck.currentJobRef.projectID,
                    'jobs',
                    truck.currentJobRef.jobID,
                  );

                  const jobSnap = await getDoc(jobRef);

                  if (jobSnap.exists()) {
                    hydratedJob = {
                      id: jobSnap.id,
                      ...jobSnap.data(),
                      channelID: truck.currentJobRef.channelID,
                      projectID: truck.currentJobRef.projectID,
                    };

                    tripStatus =
                      hydratedJob?.tripStatus || hydratedJob?.status || null;
                  }
                } else if (truck?.currentJobID) {
                  const jobsQuery = query(
                    collectionGroup(db, 'jobs'),
                    where('__name__', '==', truck.currentJobID),
                  );

                  const jobsSnap = await getDocs(jobsQuery);

                  if (!jobsSnap.empty) {
                    const jobDoc = jobsSnap.docs[0];

                    hydratedJob = {
                      id: jobDoc.id,
                      ...jobDoc.data(),
                      projectID: jobDoc.ref.parent.parent?.id || null,
                      channelID:
                        jobDoc.ref.parent.parent?.parent?.parent?.id || null,
                    };

                    tripStatus =
                      hydratedJob?.tripStatus || hydratedJob?.status || null;
                  }
                }
              } catch (jobError) {
                console.error('🔥 Error hydrating live truck job:', jobError);
              }

              try {
                if (truck?.currentDriverID) {
                  const userRef = doc(db, 'users', truck.currentDriverID);
                  const userSnap = await getDoc(userRef);

                  if (userSnap.exists()) {
                    currentDriverName = buildDriverName(userSnap.data());
                  }
                }
              } catch (driverError) {
                console.error(
                  '🔥 Error hydrating live truck driver:',
                  driverError,
                );
              }

              return {
                ...truck,
                currentJobID: hydratedJob?.id || truck?.currentJobID || null,
                currentDriverName,
                tripStatus,
                job: hydratedJob,
              };
            }),
          );

          setTruckLocations(hydratedTrucks);
          setLoading(false);
        } catch (err) {
          console.error('🔥 Error fetching live truck locations:', err);
          setError(err);
          setTruckLocations([]);
          setLoading(false);
        }
      },
      err => {
        console.error('🔥 Live truck listener error:', err);
        setError(err);
        setTruckLocations([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorID]);

  return {
    truckLocations,
    loading,
    error,
  };
};

export default useLiveTruckLocations;