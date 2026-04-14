import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { decode } from '@liberty-rider/flexpolyline';
import Geolocation from '@react-native-community/geolocation';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
import { useConfig } from '../../../../config';
import {
  setOperationSheetData,
  resetOperationSheetData,
} from '../../../../redux';

import useActiveJob from '../../../hooks/useActiveJob';
import useUpdateJobTripStatus from '../../../hooks/useUpdateJobTripStatus';
import useRouteToDestination from '../../../hooks/useRouteToDestination';
import useSyncDriverLocation from '../../../hooks/useSyncDriverLocation';
import useTripTracking from '../../../hooks/useTripTracking';

import dynamicStyles from './styles';
import OperationBottomSheetScreen from './OperationBottomSheetScreen/OperationBottomSheetScreen';

type LatLng = {
  latitude: number;
  longitude: number;
};

type JobPoint = {
  lat?: number;
  lon?: number;
  title?: string;
  address?: string;
};

type DestinationPoint = {
  lat: number;
  lon: number;
  title?: string;
  address?: string;
};

type RouteSummary = {
  distanceMiles: number;
  durationMinutes: number;
};

const HomeTrackingScreen = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const config = useConfig();

  const mapRef = useRef<MapView | null>(null);
  const hasCompletedRef = useRef(false);

  const currentUser = useCurrentUser();
  const { activeJob, loading: loadingJob } = useActiveJob(currentUser?.id);

  const requestedAction = useSelector(
    (state: any) => state.operationSheet?.requestedAction,
  );

  const [driverLocation, setDriverLocation] = useState<LatLng | null>(
    currentUser?.location || null,
  );
  const [pickupRouteCoords, setPickupRouteCoords] = useState<LatLng[]>([]);
  const [pickupSummary, setPickupSummary] = useState<RouteSummary | null>(null);
  const [isCloseToPickup, setIsCloseToPickup] = useState(false);
  const [isCloseToDropoff, setIsCloseToDropoff] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  const origin: JobPoint | null = activeJob?.origin || null;
  const destination: JobPoint | null = activeJob?.destination || null;
 console.log('activeJob',activeJob)
  const normalizedDestination: DestinationPoint | null =
    typeof destination?.lat === 'number' &&
    typeof destination?.lon === 'number'
      ? {
          lat: destination.lat,
          lon: destination.lon,
          title: destination.title,
          address: destination.address,
        }
      : null;

  const currentTarget = useMemo(() => {
    if (activeJob?.tripStatus === 'in_progress') return origin;
    if (activeJob?.tripStatus === 'en_route_to_dropoff') return destination;
    return destination || origin || null;
  }, [activeJob?.tripStatus, origin, destination]);

  const { updateTripStatus } = useUpdateJobTripStatus(
    activeJob?.channelID,
    activeJob?.projectID,
  );

  const isPickupPhase = activeJob?.tripStatus === 'in_progress';
  const isDropoffPhase = activeJob?.tripStatus === 'en_route_to_dropoff';

  const isTripRunning = ['in_progress', 'en_route_to_dropoff'].includes(
    activeJob?.tripStatus,
  );

  const { finalizeTripAndSaveToFirestore } = useTripTracking({
    shouldTrack: isTripRunning,
    jobID: activeJob?.id,
    channelID: activeJob?.channelID,
    projectID: activeJob?.projectID,
  });

  const {
    coords: dropoffRouteCoords = [],
    summary: dropoffSummary,
  } = useRouteToDestination({
    from: driverLocation,
    to: normalizedDestination,
  });

  useSyncDriverLocation({
    driverID: currentUser?.id,
    jobID: activeJob?.id,
    channelID: activeJob?.channelID,
    projectID: activeJob?.projectID,
    assignedTruckID: activeJob?.assignedTruckID,
    vendorID: activeJob?.vendorID,
    currentTarget,
  });

  useEffect(() => {
    let watchId: number | null = null;

    const requestPermissionAndWatch = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
        }

        watchId = Geolocation.watchPosition(
          position => {
            setDriverLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          error => {
            console.log('❌ Geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 10,
            interval: 10000,
            fastestInterval: 5000,
          },
        );
      } catch (error) {
        console.log('❌ Error requesting location permission:', error);
      }
    };

    requestPermissionAndWatch();

    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, []);

  useEffect(() => {
    const fetchRouteToPickup = async () => {
      if (
        !driverLocation?.latitude ||
        !driverLocation?.longitude ||
        typeof origin?.lat !== 'number' ||
        typeof origin?.lon !== 'number' ||
        !config?.hereAPIKey
      ) {
        return;
      }

      const url = `https://router.hereapi.com/v8/routes?origin=${driverLocation.latitude},${driverLocation.longitude}&destination=${origin.lat},${origin.lon}&transportMode=truck&return=summary,polyline&apikey=${config.hereAPIKey}`;

      try {
        const res = await fetch(url);
        const json = await res.json();
        const section = json?.routes?.[0]?.sections?.[0];

        if (!section?.polyline) {
          throw new Error('No route found');
        }

        const decoded = decode(section.polyline).polyline;
        const coords: LatLng[] = decoded.map(([lat, lon]: [number, number]) => ({
          latitude: lat,
          longitude: lon,
        }));

        setPickupRouteCoords(coords);
        setPickupSummary({
          distanceMiles: +(section.summary.length / 1609.34).toFixed(2),
          durationMinutes: Math.round(section.summary.duration / 60),
        });
      } catch (err: any) {
        console.error('🔥 Error calculating pickup route:', err?.message || err);
      }
    };

    if (isPickupPhase) {
      fetchRouteToPickup();
    }
  }, [
    driverLocation?.latitude,
    driverLocation?.longitude,
    origin?.lat,
    origin?.lon,
    config?.hereAPIKey,
    isPickupPhase,
  ]);

  useEffect(() => {
    if (!driverLocation || (!origin && !destination)) return;

    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371e3;

    const calcDistance = (point: JobPoint | null) => {
      if (typeof point?.lat !== 'number' || typeof point?.lon !== 'number') {
        return Number.MAX_SAFE_INTEGER;
      }

      const dLat = toRad(point.lat - driverLocation.latitude);
      const dLon = toRad(point.lon - driverLocation.longitude);

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(driverLocation.latitude)) *
          Math.cos(toRad(point.lat)) *
          Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const closeRange = config?.tracking?.closeRange || 160;

    setIsCloseToPickup(calcDistance(origin) < closeRange);
    setIsCloseToDropoff(calcDistance(destination) < closeRange);
  }, [driverLocation, origin, destination, config?.tracking?.closeRange]);

  const fitMapToPolyline = useCallback(() => {
    const coordsToUse = isDropoffPhase ? dropoffRouteCoords : pickupRouteCoords;

    if (mapRef.current && coordsToUse.length > 1) {
      mapRef.current.fitToCoordinates(coordsToUse, {
        edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    }
  }, [pickupRouteCoords, dropoffRouteCoords, isDropoffPhase]);

  useEffect(() => {
    fitMapToPolyline();
  }, [fitMapToPolyline]);

  const handleArrivalAtPickup = async () => {
    if (!activeJob?.id) return;

    await updateTripStatus(activeJob.id, 'arrived_at_pickup');

    navigation.navigate('TicketCapture', {
      type: 'pickup',
      jobID: activeJob.id,
      channelID: activeJob.channelID,
      projectID: activeJob.projectID,
    });
  };

  const handleArrivalAtDropoff = async () => {
    if (
      !activeJob?.id ||
      !activeJob?.channelID ||
      !activeJob?.projectID ||
      hasCompletedRef.current
    ) {
      return;
    }

    hasCompletedRef.current = true;

    try {
      await finalizeTripAndSaveToFirestore();

      await updateTripStatus(
        activeJob.id,
        'completed',
        activeJob.assignedDriverID,
      );

      navigation.navigate('TicketCapture', {
        type: 'delivery',
        jobID: activeJob.id,
        channelID: activeJob.channelID,
        projectID: activeJob.projectID,
        driverID: activeJob.assignedDriverID,
      });
    } catch (error) {
      hasCompletedRef.current = false;
      console.error('🔥 Error completing trip:', error);
    }
  };

  const activePolyline = isPickupPhase ? pickupRouteCoords : dropoffRouteCoords;
  const activeSummary = isPickupPhase ? pickupSummary : dropoffSummary;

  const showArrivalPickupButton = isPickupPhase && isCloseToPickup;
  const showArrivalDropoffButton = isDropoffPhase;

  const currentStatusLabel = isPickupPhase
    ? localized('Heading to Pickup')
    : localized('Heading to Dropoff');

 const currentContactName = isPickupPhase
  ? typeof activeJob?.pickupContact === 'string'
    ? activeJob?.pickupContact
    : activeJob?.pickupContact?.name || activeJob?.pickupContactName || ''
  : typeof activeJob?.dropoffContact === 'string'
    ? activeJob?.dropoffContact
    : activeJob?.dropoffContact?.name || activeJob?.dropoffContactName || '';

const currentContactPhone = isPickupPhase
  ? typeof activeJob?.pickupContact === 'object'
    ? activeJob?.pickupContact?.phone || activeJob?.pickupPhone || activeJob?.contactPhone || ''
    : activeJob?.pickupPhone || activeJob?.contactPhone || ''
  : typeof activeJob?.dropoffContact === 'object'
    ? activeJob?.dropoffContact?.phone || activeJob?.dropoffPhone || activeJob?.contactPhone || ''
    : activeJob?.dropoffPhone || activeJob?.contactPhone || '';

  const currentInstructions = isPickupPhase
    ? activeJob?.pickupInstructions || activeJob?.instructions
    : activeJob?.dropoffInstructions || activeJob?.instructions;

  useEffect(() => {
    if (!activeJob) {
      dispatch(resetOperationSheetData());
      return;
    }

    dispatch(
      setOperationSheetData({
        isPickupPhase,
        isCloseToDropoff,
        showArrivalPickupButton,
        showArrivalDropoffButton,
        currentStatusLabel,
        origin,
        destination,
        activeSummary,
        currentContactName,
        currentContactPhone,
        currentInstructions,
        onPrimaryActionType: isPickupPhase
          ? "pickup_arrival"
          : isDropoffPhase
            ? "dropoff_arrival"
            : null,
      }),
    );

    return () => {
      dispatch(resetOperationSheetData());
    };
  }, [
    dispatch,
    activeJob,
    isPickupPhase,
    isCloseToDropoff,
    showArrivalPickupButton,
    showArrivalDropoffButton,
    currentStatusLabel,
    origin,
    destination,
    activeSummary,
    currentContactName,
    currentContactPhone,
    currentInstructions,
  ]);

  useEffect(() => {
  if (!requestedAction) return;

  const run = async () => {
    try {
      if (requestedAction === 'pickup_arrival') {
        await handleArrivalAtPickup();
      } else if (requestedAction === 'dropoff_arrival') {
        await handleArrivalAtDropoff();
      }
    } finally {
      dispatch(
        setOperationSheetData({
          requestedAction: null,
        }),
      );
    }
  };

  run();
}, [requestedAction, dispatch]);

  if (!loadingJob && !activeJob) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.emptyText}>
          {localized('There is no active job assigned to you at the moment.')}
        </Text>
      </View>
    );
  }

  if (loadingJob || !driverLocation || !activeJob) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.mapContainer}
        initialRegion={{
          latitude: driverLocation.latitude,
          longitude: driverLocation.longitude,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        onMapReady={() => setMapLoaded(true)}
      >
        <Marker coordinate={driverLocation} title="My Location" pinColor="blue" />

        {typeof origin?.lat === 'number' && typeof origin?.lon === 'number' ? (
          <Marker
            coordinate={{ latitude: origin.lat, longitude: origin.lon }}
            title={origin.title || 'Pickup'}
            description={origin.address}
            pinColor="green"
          />
        ) : null}

        {typeof destination?.lat === 'number' &&
        typeof destination?.lon === 'number' ? (
          <Marker
            coordinate={{
              latitude: destination.lat,
              longitude: destination.lon,
            }}
            title={destination.title || 'Dropoff'}
            description={destination.address}
            pinColor="red"
          />
        ) : null}

        {activePolyline?.length > 1 ? (
          <Polyline
            coordinates={activePolyline}
            strokeWidth={5}
            strokeColor={theme.colors[appearance].primary}
          />
        ) : null}
      </MapView>

      <View style={styles.floatingHeader}>
        <Text style={styles.floatingHeaderLabel}>{currentStatusLabel}</Text>
        <Text style={styles.floatingHeaderSub}>
          {activeSummary?.distanceMiles || '—'} mi •{' '}
          {activeSummary?.durationMinutes || '—'} min
        </Text>
      </View>

      {mapLoaded && <OperationBottomSheetScreen />}
    </View>
  );
};

export default HomeTrackingScreen;