import { useEffect, useRef } from 'react';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import * as flexPolyline from '@liberty-rider/flexpolyline';

import { db } from '../../core/firebase/config';
import { useConfig } from '../../config';

const STORAGE_KEY = 'tracked_coords';

type LatLng = {
  latitude: number;
  longitude: number;
};

const useTripTracking = (shouldTrack: boolean = false) => {
  const watchIdRef = useRef<number | null>(null);
  const lastStoredCoordsRef = useRef<LatLng | null>(null);

  const config = useConfig();
  const distanceFilterLocal = config?.tracking?.localDistance || 50;

  const calcDistanceMeters = (a: LatLng, b: LatLng) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const aVal = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * (2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal)));
  };

  const appendLocationToStorage = async (location: LatLng) => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const current: LatLng[] = raw ? JSON.parse(raw) : [];
      current.push(location);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      lastStoredCoordsRef.current = location;
    } catch (err) {
      console.error('🔥 Error saving location:', err);
    }
  };

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
        const coords: LatLng = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        const last = lastStoredCoordsRef.current;
        if (!last || calcDistanceMeters(last, coords) >= distanceFilterLocal) {
          await appendLocationToStorage(coords);
        }
      },
      err => console.log('❌ Geolocation error:', err),
      { enableHighAccuracy: true, distanceFilter: distanceFilterLocal, interval: 10000, fastestInterval: 5000 }
    );

    return () => { if (watchIdRef.current !== null) Geolocation.clearWatch(watchIdRef.current); };
  }, [shouldTrack, distanceFilterLocal]);

  const finalizeTripAndGetPolyline = async (): Promise<string | null> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const coords: LatLng[] = JSON.parse(raw);
      const points: [number, number][] = coords
        .filter(p => p && typeof p.latitude === 'number' && !Number.isNaN(p.latitude))
        .map(p => [p.latitude, p.longitude]);

      if (points.length === 0) {
        await AsyncStorage.removeItem(STORAGE_KEY);
        return null;
      }

      // FIX AQUÍ: Casteo a (flexPolyline as any) para saltar el error del .d.ts incompleto
      const polyline = (flexPolyline as any).encode({
        polyline: points,
        precision: 5,
      });

      await AsyncStorage.removeItem(STORAGE_KEY);
      lastStoredCoordsRef.current = null;
      return polyline;
    } catch (err) {
      console.error('🔥 Error encoding polyline:', err);
      return null;
    }
  };

  const finalizeTripAndSaveToFirestore = async (jobID?: string | null, channelID?: string | null, projectID?: string | null) => {
    try {
      const polyline = await finalizeTripAndGetPolyline();
      if (!polyline || !jobID || !channelID || !projectID) return;

      const jobRef = doc(db, 'project_channels', channelID, 'projects', projectID, 'jobs', jobID);
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

  return { finalizeTripAndGetPolyline, finalizeTripAndSaveToFirestore };
};

export default useTripTracking;