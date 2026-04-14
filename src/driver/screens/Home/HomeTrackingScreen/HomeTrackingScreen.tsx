import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  TouchableOpacity,
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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

  const currentUser = useCurrentUser();
  const { activeJob, loading: loadingJob } = useActiveJob(currentUser?.id);

  const requestedAction = useSelector(
    (state: any) => state.operationSheet?.requestedAction,
  );

  const openRootDrawer = useCallback(() => {
  let parent = navigation.getParent?.();

  while (parent) {
    if (typeof parent.openDrawer === 'function') {
      parent.openDrawer();
      return;
    }
    parent = parent.getParent?.();
  }
}, [navigation]);
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

  const { updateTripStatus } = useUpdateJobTripStatus(
    activeJob?.channelID,
    activeJob?.projectID,
  );

  const isPickupPhase = activeJob?.tripStatus === 'in_progress';
  const isArrivedAtPickupPhase = activeJob?.tripStatus === 'arrived_at_pickup';
  const isDropoffPhase = activeJob?.tripStatus === 'en_route_to_dropoff';
  const isArrivedAtDropoffPhase = activeJob?.tripStatus === 'arrived_at_dropoff';

  const isTripRunning = [
    'in_progress',
    'arrived_at_pickup',
    'en_route_to_dropoff',
    'arrived_at_dropoff',
  ].includes(activeJob?.tripStatus);

  const currentTarget = useMemo(() => {
    if (isPickupPhase || isArrivedAtPickupPhase) return origin;
    if (isDropoffPhase || isArrivedAtDropoffPhase) return destination;
    return destination || origin || null;
  }, [
    isPickupPhase,
    isArrivedAtPickupPhase,
    isDropoffPhase,
    isArrivedAtDropoffPhase,
    origin,
    destination,
  ]);

  useTripTracking({
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

    if (isPickupPhase || isArrivedAtPickupPhase) {
      fetchRouteToPickup();
    }
  }, [
    driverLocation?.latitude,
    driverLocation?.longitude,
    origin?.lat,
    origin?.lon,
    config?.hereAPIKey,
    isPickupPhase,
    isArrivedAtPickupPhase,
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
    const coordsToUse =
      isPickupPhase || isArrivedAtPickupPhase
        ? pickupRouteCoords
        : dropoffRouteCoords;

    if (mapRef.current && coordsToUse.length > 1) {
      mapRef.current.fitToCoordinates(coordsToUse, {
        edgePadding: { top: 120, right: 60, bottom: 280, left: 60 },
        animated: true,
      });
    }
  }, [
    pickupRouteCoords,
    dropoffRouteCoords,
    isPickupPhase,
    isArrivedAtPickupPhase,
  ]);

  useEffect(() => {
    fitMapToPolyline();
  }, [fitMapToPolyline]);

  const handleArrivalAtPickup = async () => {
    if (!activeJob?.id) return;
    await updateTripStatus(activeJob.id, 'arrived_at_pickup');
  };

  const handleArrivalAtDropoff = async () => {
    if (!activeJob?.id) return;
    await updateTripStatus(activeJob.id, 'arrived_at_dropoff');
  };

  const activePolyline =
    isPickupPhase || isArrivedAtPickupPhase
      ? pickupRouteCoords
      : dropoffRouteCoords;

  const activeSummary =
    isPickupPhase || isArrivedAtPickupPhase
      ? pickupSummary
      : dropoffSummary;

  const showArrivalPickupButton = isPickupPhase && isCloseToPickup;
  const showArrivalDropoffButton = isDropoffPhase && isCloseToDropoff;

  const currentStatusLabel = isPickupPhase
    ? localized('Heading to Pickup')
    : isArrivedAtPickupPhase
    ? localized('Arrived at Pickup')
    : isDropoffPhase
    ? localized('Heading to Dropoff')
    : isArrivedAtDropoffPhase
    ? localized('Arrived at Dropoff')
    : localized('Trip');

  const currentContactName =
    isPickupPhase || isArrivedAtPickupPhase
      ? activeJob?.pickupContact || ''
      : activeJob?.dropoffContact || '';

  const currentContactPhone =
    isPickupPhase || isArrivedAtPickupPhase
      ? activeJob?.pickupPhone || activeJob?.contactPhone || ''
      : activeJob?.dropoffPhone || activeJob?.contactPhone || '';

  const currentInstructions =
    isPickupPhase || isArrivedAtPickupPhase
      ? activeJob?.pickupInstructions || activeJob?.instructions || ''
      : activeJob?.dropoffInstructions || activeJob?.instructions || '';

  const onPrimaryActionType = isPickupPhase
    ? 'pickup_arrival'
    : isArrivedAtPickupPhase
    ? 'capture_pickup_ticket'
    : isDropoffPhase
    ? 'dropoff_arrival'
    : isArrivedAtDropoffPhase
    ? 'capture_dropoff_ticket'
    : null;

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
        onPrimaryActionType,
        showNavigateButton:
          !isArrivedAtPickupPhase && !isArrivedAtDropoffPhase,
      }),
    );

    return () => {
      dispatch(resetOperationSheetData());
    };
  }, [
    dispatch,
    activeJob,
    isPickupPhase,
    isArrivedAtPickupPhase,
    isArrivedAtDropoffPhase,
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
    onPrimaryActionType,
  ]);

  useEffect(() => {
    if (!requestedAction) return;

    const run = async () => {
      try {
        if (requestedAction === 'pickup_arrival') {
          await handleArrivalAtPickup();
        } else if (requestedAction === 'capture_pickup_ticket') {
          if (!activeJob?.id) return;

          navigation.navigate('TicketCapture', {
            type: 'pickup',
            jobID: activeJob.id,
            channelID: activeJob.channelID,
            projectID: activeJob.projectID,
          });
        } else if (requestedAction === 'dropoff_arrival') {
          await handleArrivalAtDropoff();
        } else if (requestedAction === 'capture_dropoff_ticket') {
          if (!activeJob?.id) return;

          navigation.navigate('TicketCapture', {
            type: 'delivery',
            jobID: activeJob.id,
            channelID: activeJob.channelID,
            projectID: activeJob.projectID,
            driverID: activeJob.assignedDriverID,
          });
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
  }, [requestedAction, dispatch, activeJob, navigation]);

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
          color={theme.colors[appearance].primaryForeground}
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
            strokeColor={theme.colors[appearance].primaryForeground}
          />
        ) : null}
      </MapView>

      <View style={styles.floatingHeader}>
  <TouchableOpacity
    onPress={openRootDrawer}
    style={styles.floatingMenuButton}
  >
    <MaterialCommunityIcons
      name="menu"
      size={24}
      color={theme.colors[appearance].primaryText}
    />
  </TouchableOpacity>

  <View style={styles.floatingHeaderCenter}>
    <Text style={styles.floatingHeaderLabel}>{currentStatusLabel}</Text>
    <Text style={styles.floatingHeaderSub}>
      {activeSummary?.distanceMiles || '—'} mi •{' '}
      {activeSummary?.durationMinutes || '—'} min
    </Text>
  </View>

  <View style={styles.floatingHeaderRightSpacer} />
</View>

      {mapLoaded && <OperationBottomSheetScreen />}
    </View>
  );
};

export default HomeTrackingScreen;