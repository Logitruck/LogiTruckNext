import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '../../core/firebase/config';

export type TrackingPoint = {
  id: string;
  latitude: number;
  longitude: number;
  createdAt?: any | null;
};

type MapCoordinate = {
  latitude: number;
  longitude: number;
};

const isValidCoordinate = (latitude: any, longitude: any) => {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude)
  );
};

const getTimestampMillis = (value: any): number => {
  if (!value) return 0;

  try {
    if (typeof value?.toMillis === 'function') {
      return value.toMillis();
    }

    if (typeof value?.seconds === 'number') {
      return value.seconds * 1000;
    }

    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
};

const useJobTrackingHistory = (
  channelID?: string | null,
  projectID?: string | null,
  jobID?: string | null,
) => {
  const [trackingPoints, setTrackingPoints] = useState<TrackingPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!channelID || !projectID || !jobID) {
      setTrackingPoints([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const trackingRef = collection(
      db,
      'project_channels',
      channelID,
      'projects',
      projectID,
      'jobs',
      jobID,
      'tracking',
    );

    const trackingQuery = query(trackingRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      trackingQuery,
      snapshot => {
        const points: TrackingPoint[] = snapshot.docs
          .map(docSnap => {
            const data = docSnap.data();

            return {
              id: docSnap.id,
              latitude: data?.latitude,
              longitude: data?.longitude,
              createdAt: data?.createdAt || null,
            };
          })
          .filter(point => isValidCoordinate(point.latitude, point.longitude))
          .sort(
            (a, b) =>
              getTimestampMillis(a.createdAt) - getTimestampMillis(b.createdAt),
          );

        setTrackingPoints(points);
        setLoading(false);
      },
      err => {
        console.error('🔥 Error loading job tracking history:', err);
        setError(err);
        setTrackingPoints([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [channelID, projectID, jobID]);

  const lastTrackingPoint = useMemo(() => {
    if (!trackingPoints.length) return null;
    return trackingPoints[trackingPoints.length - 1];
  }, [trackingPoints]);

  const pathCoordinates = useMemo<MapCoordinate[]>(() => {
    return trackingPoints.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));
  }, [trackingPoints]);

  return {
    trackingPoints,
    pathCoordinates,
    lastTrackingPoint,
    loading,
    error,
  };
};

export default useJobTrackingHistory;