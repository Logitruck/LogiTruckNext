import { useEffect, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc,
  serverTimestamp,
  updateDoc,
  collection,
  addDoc,
} from 'firebase/firestore';
import * as flexPolyline from '@liberty-rider/flexpolyline';

import { db } from '../../core/firebase/config';
import { useConfig } from '../../config';

const STORAGE_KEY = 'tracked_coords';

type LatLng = {
  latitude: number;
  longitude: number;
};

type Params = {
  shouldTrack: boolean;
  jobID?: string;
  channelID?: string;
  projectID?: string;
};

const useTripTracking = ({
  shouldTrack,
  jobID,
  channelID,
  projectID,
}: Params) => {
  const watchIdRef = useRef<number | null>(null);
  const lastStoredCoordsRef = useRef<LatLng | null>(null);

  const config = useConfig();
  const distanceFilterLocal = config?.tracking?.localDistance || 50;

  // 🧠 DISTANCIA
  const calcDistanceMeters = (a: LatLng, b: LatLng) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3;

    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);

    const aVal =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.latitude)) *
        Math.cos(toRad(b.latitude)) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal)));
  };

  // 💾 STORAGE LOCAL
  const appendLocationToStorage = async (location: LatLng) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const current: LatLng[] = raw ? JSON.parse(raw) : [];

      current.push(location);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      lastStoredCoordsRef.current = location;
    } catch (err) {
      console.error('🔥 Storage error:', err);
    }
  };

  // 🌍 TRACKING EN VIVO (Firestore)
  const updateLiveLocation = async (coords: LatLng) => {
    try {
      if (!jobID || !channelID || !projectID) return;

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
        lastLocation: coords,
        lastUpdatedAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('🔥 live tracking error', e);
    }
  };

  // 📍 HISTORIAL (cada cierto punto)
  const saveTrackingPoint = async (coords: LatLng) => {
    try {
      if (!jobID || !channelID || !projectID) return;

      const ref = collection(
        db,
        'project_channels',
        channelID,
        'projects',
        projectID,
        'jobs',
        jobID,
        'tracking',
      );

      await addDoc(ref, {
        ...coords,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error('🔥 tracking point error', e);
    }
  };

  // 🎯 WATCH GPS
  useEffect(() => {
    if (!shouldTrack) {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    watchIdRef.current = Geolocation.watchPosition(
      async position => {
        try {
          const coords: LatLng = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          const last = lastStoredCoordsRef.current;

          const distance = last
            ? calcDistanceMeters(last, coords)
            : Infinity;

          const MIN_DISTANCE = 30;

          if (
            !last ||
            distance >= Math.max(distanceFilterLocal, MIN_DISTANCE)
          ) {
            await appendLocationToStorage(coords);

            // 🔥 NUEVO
            await updateLiveLocation(coords);

            // 🔥 opcional (cada 100m)
            if (distance > 400) {
              await saveTrackingPoint(coords);
            }
          }
        } catch (err) {
          console.error('🔥 Tracking error:', err);
        }
      },
      err => console.log('❌ Geo error:', err),
      {
        enableHighAccuracy: true,
        distanceFilter: distanceFilterLocal,
        interval: 10000,
        fastestInterval: 5000,
      },
    );

    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [shouldTrack]);

  // 🧭 GENERAR POLYLINE
  const finalizeTripAndGetPolyline = async (): Promise<string | null> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const coords: LatLng[] = JSON.parse(raw);

      const points: [number, number][] = coords
        .filter(
          p =>
            p &&
            typeof p.latitude === 'number' &&
            typeof p.longitude === 'number' &&
            !Number.isNaN(p.latitude) &&
            !Number.isNaN(p.longitude),
        )
        .map(p => [p.latitude, p.longitude]);

      if (points.length < 2) {
        console.log('⚠️ Not enough points');
        await AsyncStorage.removeItem(STORAGE_KEY);
        return null;
      }

      const polyline = (flexPolyline as any).encode({
        polyline: points,
        precision: 5,
      });

      await AsyncStorage.removeItem(STORAGE_KEY);
      lastStoredCoordsRef.current = null;

      return polyline;
    } catch (err) {
      console.error('🔥 encode error:', err);
      return null;
    }
  };

  // 💾 GUARDAR FINAL
  const finalizeTripAndSaveToFirestore = async () => {
    try {
      const polyline = await finalizeTripAndGetPolyline();

      if (!polyline || !jobID || !channelID || !projectID) return;

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
        completedPolyline: polyline,
        polylineSavedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Polyline saved');
    } catch (err) {
      console.error('🔥 Firestore error:', err);
    }
  };
return {
  finalizeTripAndGetPolyline,
  finalizeTripAndSaveToFirestore,
  isTracking: watchIdRef.current !== null,
}};
export default useTripTracking;