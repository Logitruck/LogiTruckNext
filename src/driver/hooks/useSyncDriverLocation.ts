import { useEffect, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import {
  doc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../../core/firebase/config';
import { useConfig } from '../../config';

type LatLng = {
  latitude: number;
  longitude: number;
};

type TargetPoint = {
  lat?: number;
  lon?: number;
} | null;

type UseSyncDriverLocationParams = {
  driverID?: string | null;
  jobID?: string | null;
  channelID?: string | null;
  projectID?: string | null;
  assignedTruckID?: string | null;
  vendorID?: string | null;
  currentTarget?: TargetPoint;
};

const useSyncDriverLocation = ({
  driverID,
  jobID,
  channelID,
  projectID,
  assignedTruckID,
  vendorID,
  currentTarget,
}: UseSyncDriverLocationParams) => {
  const config = useConfig();

  const {
    firebaseUpdateThreshold = 300,
    nearDestinationRadius = 1000,
  } = config?.tracking || {};

  const lastFirebaseCoordsRef = useRef<LatLng | null>(null);

  const calcDistanceMeters = (a: LatLng, b: LatLng) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3;

    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
  };

  const updateLocationInFirebase = async (location: LatLng) => {
    if (!driverID) return;

    const updates = {
      locationUpdatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'users', driverID), {
      location,
      ...updates,
    });

    if (channelID && projectID && jobID) {
      await updateDoc(
        doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
          'jobs',
          jobID,
        ),
        {
          driverLocation: location,
          ...updates,
        },
      );
    }

    if (vendorID && assignedTruckID) {
      await updateDoc(
        doc(
          db,
          'vendor_vehicles',
          vendorID,
          'vehicles',
          assignedTruckID,
        ),
        {
          currentLocation: location,
          currentDriverID: driverID,
          currentJobID: jobID || null,
          currentJobContext: jobID
            ? {
                jobID,
                channelID: channelID || null,
                projectID: projectID || null,
              }
            : null,
          ...updates,
        },
      );
    }

    lastFirebaseCoordsRef.current = location;
  };

  useEffect(() => {
    if (!driverID || !assignedTruckID || !vendorID) {
      return;
    }

    const watchId = Geolocation.watchPosition(
      async position => {
        try {
          const coords: LatLng = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          let shouldUpload = false;

          if (lastFirebaseCoordsRef.current) {
            const distanceMoved = calcDistanceMeters(
              coords,
              lastFirebaseCoordsRef.current,
            );

            if (distanceMoved >= firebaseUpdateThreshold) {
              shouldUpload = true;
            }
          } else {
            shouldUpload = true;
          }

          if (
            typeof currentTarget?.lat === 'number' &&
            typeof currentTarget?.lon === 'number'
          ) {
            const targetDistance = calcDistanceMeters(coords, {
              latitude: currentTarget.lat,
              longitude: currentTarget.lon,
            });

            if (targetDistance < nearDestinationRadius) {
              shouldUpload = true;
            }
          }

          if (shouldUpload) {
            await updateLocationInFirebase(coords);
          }
        } catch (error) {
          console.error('❌ Error syncing driver location:', error);
        }
      },
      error => {
        console.error('❌ Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 30,
        interval: 10000,
        fastestInterval: 5000,
      },
    );

    return () => {
      Geolocation.clearWatch(watchId);
    };
  }, [
    driverID,
    jobID,
    channelID,
    projectID,
    assignedTruckID,
    vendorID,
    currentTarget?.lat,
    currentTarget?.lon,
    firebaseUpdateThreshold,
    nearDestinationRadius,
  ]);
};

export default useSyncDriverLocation;