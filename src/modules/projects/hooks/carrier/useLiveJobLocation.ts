// src/driverapp/hooks/useLiveJobLocation.ts
import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

type LatLng = {
  latitude: number;
  longitude: number;
};

type UseLiveJobLocationReturn = {
  driverLocation: LatLng | null;
  loading: boolean;
};

const useLiveJobLocation = (
  channelID?: string,
  projectID?: string,
  jobID?: string
): UseLiveJobLocationReturn => {
  const [driverLocation, setDriverLocation] = useState<LatLng | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!channelID || !projectID || !jobID) {
      setDriverLocation(null);
      setLoading(false);
      return;
    }

    const jobRef = doc(
      db,
      'project_channels',
      channelID,
      'projects',
      projectID,
      'jobs',
      jobID
    );

    const unsubscribe = onSnapshot(
      jobRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setDriverLocation(null);
          setLoading(false);
          return;
        }

        const data = docSnap.data() as any;

        if (data?.driverLocation?.latitude && data?.driverLocation?.longitude) {
          setDriverLocation({
            latitude: data.driverLocation.latitude,
            longitude: data.driverLocation.longitude,
          });
        } else {
          setDriverLocation(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error('🔥 Error listening to job location:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [channelID, projectID, jobID]);

  return { driverLocation, loading };
};

export default useLiveJobLocation;