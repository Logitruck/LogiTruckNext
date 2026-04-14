import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MapView, { Marker, Polyline, LatLng as MapLatLng } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import useJobTrackingHistory from '../../../hooks/useJobTrackingHistory';
import useRouteToDestination from '../../../../driver/hooks/useRouteToDestination';

type MapPoint = {
  latitude: number;
  longitude: number;
};

type DestinationPoint = {
  lat: number;
  lon: number;
};

const isValidPoint = (point: any): point is MapPoint => {
  return (
    point &&
    typeof point.latitude === 'number' &&
    typeof point.longitude === 'number'
  );
};

const TruckLiveDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { truck } = route.params;

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const mapRef = useRef<MapView | null>(null);

  const job = truck?.job || null;

  const {
    trackingPoints,
    lastTrackingPoint,
    loading: trackingLoading,
  } = useJobTrackingHistory(
    job?.channelID || truck?.channelID || null,
    job?.projectID || truck?.projectID || null,
    job?.id || truck?.currentJobID || null,
  );

  const fallbackCurrentLocation: MapPoint | null = isValidPoint(truck?.currentLocation)
    ? truck.currentLocation
    : null;

  const currentLocation: MapPoint | null = lastTrackingPoint
    ? {
        latitude: lastTrackingPoint.latitude,
        longitude: lastTrackingPoint.longitude,
      }
    : fallbackCurrentLocation;

  const pickup: MapPoint | null =
    typeof job?.origin?.lat === 'number' &&
    typeof job?.origin?.lon === 'number'
      ? {
          latitude: job.origin.lat,
          longitude: job.origin.lon,
        }
      : null;

  const dropoff: MapPoint | null =
    typeof job?.destination?.lat === 'number' &&
    typeof job?.destination?.lon === 'number'
      ? {
          latitude: job.destination.lat,
          longitude: job.destination.lon,
        }
      : null;

  const historicalPath: MapPoint[] = useMemo(() => {
    return trackingPoints.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));
  }, [trackingPoints]);

  const routeOrigin = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : null;

  const routeDestination: DestinationPoint | null =
    typeof job?.destination?.lat === 'number' &&
    typeof job?.destination?.lon === 'number'
      ? {
          lat: job.destination.lat,
          lon: job.destination.lon,
        }
      : null;

  const {
    coords: remainingRouteCoords,
    summary: remainingRouteSummary,
    loading: routeLoading,
  } = useRouteToDestination({
    from: routeOrigin,
    to: routeDestination,
  });

  const distanceText = remainingRouteSummary?.distanceMiles
    ? `${remainingRouteSummary.distanceMiles} ${localized('mi')}`
    : '—';

  const durationText = remainingRouteSummary?.durationMinutes
    ? `${remainingRouteSummary.durationMinutes} ${localized('min')}`
    : '—';

  const tripStatusLabel = useMemo(() => {
    switch (truck?.tripStatus) {
      case 'heading_to_pickup':
        return localized('Heading to Pickup');
      case 'arrived_at_pickup':
        return localized('Arrived at Pickup');
      case 'en_route':
      case 'in_progress':
        return localized('In operation');
      case 'en_route_to_dropoff':
        return localized('Heading to Dropoff');
      case 'arrived_at_dropoff':
        return localized('Arrived at Dropoff');
      case 'completed':
        return localized('Completed');
      case 'delayed':
        return localized('Delayed');
      default:
        return localized('Idle');
    }
  }, [truck?.tripStatus, localized]);

  const statusColor = useMemo(() => {
    switch (truck?.tripStatus) {
      case 'heading_to_pickup':
      case 'arrived_at_pickup':
      case 'en_route':
      case 'in_progress':
      case 'en_route_to_dropoff':
      case 'arrived_at_dropoff':
        return 'green';
      case 'delayed':
        return 'orange';
      default:
        return 'gray';
    }
  }, [truck?.tripStatus]);

  const mapPoints = useMemo<MapLatLng[]>(() => {
    const points: MapLatLng[] = [];

    if (pickup) points.push(pickup);
    if (dropoff) points.push(dropoff);
    if (currentLocation) points.push(currentLocation);

    if (historicalPath.length > 0) {
      points.push(...historicalPath);
    }

    if (remainingRouteCoords.length > 0) {
      points.push(...remainingRouteCoords);
    }

    return points;
  }, [pickup, dropoff, currentLocation, historicalPath, remainingRouteCoords]);

  useEffect(() => {
    if (!mapRef.current || !mapPoints.length) return;

    if (mapPoints.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: mapPoints[0].latitude,
          longitude: mapPoints[0].longitude,
          latitudeDelta: 0.18,
          longitudeDelta: 0.18,
        },
        500,
      );
      return;
    }

    mapRef.current.fitToCoordinates(mapPoints, {
      edgePadding: {
        top: 120,
        right: 60,
        bottom: 300,
        left: 60,
      },
      animated: true,
    });
  }, [mapPoints]);

  const handleOpenJob = () => {
    if (!job) {
      Alert.alert(
        localized('No active job'),
        localized('This truck does not have an active job at the moment.'),
      );
      return;
    }

    navigation.navigate('CarrierProjectsTab', {
      screen: 'ProjectsCarrierMain',
      params: {
        screen: 'JobDetails',
        params: { job },
      },
    });
  };

  const handleCenterMap = () => {
    if (!mapRef.current || !mapPoints.length) return;

    if (mapPoints.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: mapPoints[0].latitude,
          longitude: mapPoints[0].longitude,
          latitudeDelta: 0.18,
          longitudeDelta: 0.18,
        },
        400,
      );
      return;
    }

    mapRef.current.fitToCoordinates(mapPoints, {
      edgePadding: {
        top: 120,
        right: 60,
        bottom: 300,
        left: 60,
      },
      animated: true,
    });
  };

  const truckLabel =
    truck?.name || truck?.number || truck?.vehicleID || localized('Truck');

  const destinationLabel =
    job?.destination?.title ||
    job?.destination?.name ||
    localized('No destination available');

  const driverLabel =
    truck?.currentDriverName ||
    [
      truck?.currentDriver?.firstName || '',
      truck?.currentDriver?.lastName || '',
    ]
      .join(' ')
      .trim() ||
    localized('Not assigned');

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || 27.95,
          longitude: currentLocation?.longitude || -82.45,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        {historicalPath.length > 1 ? (
          <Polyline
            coordinates={historicalPath}
            strokeWidth={4}
            strokeColor="rgba(90, 90, 90, 0.75)"
          />
        ) : null}

        {remainingRouteCoords.length > 1 ? (
          <Polyline
            coordinates={remainingRouteCoords}
            strokeWidth={5}
            strokeColor={colors.primaryForeground}
          />
        ) : null}

        {pickup ? (
          <Marker coordinate={pickup}>
            <MaterialCommunityIcons
              name="map-marker-radius"
              size={28}
              color="green"
            />
          </Marker>
        ) : null}

        {dropoff ? (
          <Marker coordinate={dropoff}>
            <MaterialCommunityIcons
              name="flag-checkered"
              size={28}
              color="red"
            />
          </Marker>
        ) : null}

        {currentLocation ? (
          <Marker coordinate={currentLocation} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.truckMarker}>
              <MaterialCommunityIcons
                name="truck"
                size={22}
                color={colors.buttonText}
              />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <TouchableOpacity
        style={styles.floatingCenterButton}
        onPress={handleCenterMap}
      >
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={24}
          color={colors.primaryText}
        />
      </TouchableOpacity>

      <View style={styles.bottomPanel}>
        <Text style={styles.title}>{truckLabel}</Text>

        <Text style={styles.subtitle}>
          {localized('Plate')}: {truck?.licensePlate || '—'}
        </Text>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>{tripStatusLabel}</Text>
        </View>

        <Text style={styles.subtitle}>
          {localized('Driver')}: {driverLabel}
        </Text>

        <Text style={styles.subtitle}>
          {localized('Destination')}: {destinationLabel}
        </Text>

        <Text style={styles.subtitle}>
          {localized('Trip Status')}: {truck?.tripStatus || localized('Idle')}
        </Text>

        <Text style={styles.subtitle}>
          {localized('Tracked Points')}: {trackingPoints.length}
        </Text>

        <Text style={styles.subtitle}>
          {localized('Distance Remaining')}: {distanceText}
        </Text>

        <Text style={styles.subtitle}>
          {localized('ETA')}: {durationText}
        </Text>

        {(trackingLoading || routeLoading) ? (
          <Text style={styles.subtitle}>
            {localized('Updating route...')}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.button} onPress={handleOpenJob}>
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={20}
              color={colors.buttonText}
            />
            <Text style={styles.buttonText}>{localized('View Job')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color={colors.primaryText}
            />
            <Text style={styles.buttonSecondaryText}>
              {localized('Back')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TruckLiveDetailScreen;