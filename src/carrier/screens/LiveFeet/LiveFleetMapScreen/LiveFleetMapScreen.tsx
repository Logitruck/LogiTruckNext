import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import useLiveTruckLocations from '../../../hooks/useLiveTruckLocations';

type LiveFilterKey = 'all' | 'active' | 'idle' | 'stale';

const DEFAULT_REGION = {
  latitude: 27.95,
  longitude: -82.45,
  latitudeDelta: 0.3,
  longitudeDelta: 0.3,
};

const getResolvedDate = (value: any): Date | null => {
  if (!value) return null;

  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value?.seconds === 'number') {
    const date = new Date(value.seconds * 1000);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTruckLiveStatus = (truck: any) => {
  const lastUpdated = getResolvedDate(
    truck?.lastUpdatedAt ||
      truck?.updatedAt ||
      truck?.vehicle?.lastUpdatedAt ||
      truck?.lastLocationUpdatedAt,
  );

  const now = Date.now();
  const diffMinutes = lastUpdated
    ? Math.floor((now - lastUpdated.getTime()) / 60000)
    : null;

  const hasJob = !!truck?.currentJobID || !!truck?.job?.id;

  if (
    typeof truck?.currentLocation?.latitude !== 'number' ||
    typeof truck?.currentLocation?.longitude !== 'number'
  ) {
    return {
      key: 'invalid',
      label: 'No location',
      color: 'gray',
    };
  }

  if (diffMinutes !== null && diffMinutes > 15) {
    return {
      key: 'stale',
      label: 'Signal delayed',
      color: 'orange',
    };
  }

  if (hasJob) {
    return {
      key: 'active',
      label: 'In operation',
      color: 'green',
    };
  }

  return {
    key: 'idle',
    label: 'Idle',
    color: 'blue',
  };
};

const getMarkerColor = (statusKey: string) => {
  switch (statusKey) {
    case 'active':
      return '#1E8C4E';
    case 'idle':
      return '#2F80ED';
    case 'stale':
      return '#F2994A';
    default:
      return '#9E9E9E';
  }
};

const LiveFleetMapScreen = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const mapRef = useRef<MapView | null>(null);

  const { truckLocations = [], loading } = useLiveTruckLocations();

  const [selectedTruck, setSelectedTruck] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<LiveFilterKey>('all');

  const validTrucks = useMemo(() => {
    return (truckLocations || []).filter(
      (truck: any) =>
        typeof truck?.currentLocation?.latitude === 'number' &&
        typeof truck?.currentLocation?.longitude === 'number',
    );
  }, [truckLocations]);

  const filterCounters = useMemo(() => {
    return {
      all: validTrucks.length,
      active: validTrucks.filter(
        (truck: any) => getTruckLiveStatus(truck).key === 'active',
      ).length,
      idle: validTrucks.filter(
        (truck: any) => getTruckLiveStatus(truck).key === 'idle',
      ).length,
      stale: validTrucks.filter(
        (truck: any) => getTruckLiveStatus(truck).key === 'stale',
      ).length,
    };
  }, [validTrucks]);

  const filteredTrucks = useMemo(() => {
    if (activeFilter === 'all') {
      return validTrucks;
    }

    return validTrucks.filter((truck: any) => {
      const status = getTruckLiveStatus(truck);
      return status.key === activeFilter;
    });
  }, [validTrucks, activeFilter]);

  const fleetSummary = useMemo(() => {
    return {
      total: validTrucks.length,
      active: filterCounters.active,
      idle: filterCounters.idle,
      stale: filterCounters.stale,
    };
  }, [validTrucks.length, filterCounters]);

  const fitToFleet = useCallback(() => {
    if (!mapRef.current || filteredTrucks.length === 0) return;

    const coordinates = filteredTrucks.map((truck: any) => ({
      latitude: truck.currentLocation.latitude,
      longitude: truck.currentLocation.longitude,
    }));

    if (coordinates.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...coordinates[0],
          latitudeDelta: 0.08,
          longitudeDelta: 0.08,
        },
        500,
      );
      return;
    }

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: {
        top: 220,
        right: 60,
        bottom: 280,
        left: 60,
      },
      animated: true,
    });
  }, [filteredTrucks]);

  useEffect(() => {
    if (!loading) {
      fitToFleet();
    }
  }, [loading, fitToFleet]);

  useEffect(() => {
    fitToFleet();
  }, [activeFilter, fitToFleet]);

  useEffect(() => {
    if (!selectedTruck) return;

    const stillVisible = filteredTrucks.some(
      (truck: any) => truck.id === selectedTruck.id,
    );

    if (!stillVisible) {
      setSelectedTruck(null);
    }
  }, [filteredTrucks, selectedTruck]);

  const handleMarkerPress = (truck: any) => {
    setSelectedTruck(truck);
  };

  const handleOpenJob = () => {
    if (!selectedTruck?.job) return;

    navigation.navigate('CarrierProjectsTab', {
      screen: 'ProjectsCarrierMain',
      params: {
        screen: 'JobDetails',
        params: { job: selectedTruck.job },
      },
    });
  };

  const handleOpenLiveTracking = () => {
    if (!selectedTruck) return;

    navigation.navigate('TruckLiveDetail', {
      truck: selectedTruck,
    });
  };

  const filters = [
    { key: 'all' as LiveFilterKey, label: localized('All') },
    { key: 'active' as LiveFilterKey, label: localized('Active') },
    { key: 'idle' as LiveFilterKey, label: localized('Idle') },
    { key: 'stale' as LiveFilterKey, label: localized('Delayed') },
  ];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        initialRegion={DEFAULT_REGION}
      >
        {filteredTrucks.map((truck: any) => {
          const liveStatus = getTruckLiveStatus(truck);
          const markerColor = getMarkerColor(liveStatus.key);
          const isSelected = selectedTruck?.id === truck.id;

          return (
            <Marker
              key={truck.id}
              coordinate={truck.currentLocation}
              title={truck.name || truck.number || localized('Truck')}
              description={`${localized('Plate')}: ${truck.licensePlate || '—'}`}
              onPress={() => handleMarkerPress(truck)}
            >
              <View
                style={[
                  styles.markerBadge,
                  styles.markerShadow,
                  {
                    backgroundColor: markerColor,
                    transform: [{ scale: isSelected ? 1.15 : 1 }],
                    borderColor: isSelected ? colors.primaryText : '#FFFFFF',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="truck"
                  size={18}
                  color="#FFFFFF"
                />
              </View>

              <Callout tooltip onPress={() => handleMarkerPress(truck)}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>
                    {truck?.name || truck?.number || localized('Truck')}
                  </Text>

                  <Text style={styles.calloutSubtitle}>
                    {localized('Plate')}: {truck?.licensePlate || '—'}
                  </Text>

                  <View style={styles.calloutStatusRow}>
                    <MaterialCommunityIcons
                      name="circle"
                      size={10}
                      color={markerColor}
                    />
                    <Text style={styles.calloutStatusText}>
                      {localized(liveStatus.label)}
                    </Text>
                  </View>

                  <Text style={styles.calloutSubtitle}>
                    {localized('Driver')}: {truck?.currentDriverName || '—'}
                  </Text>

                  <Text style={styles.calloutSubtitle}>
                    {localized('Trip Status')}: {truck?.tripStatus || '—'}
                  </Text>

                  {!!truck?.job ? (
                    <TouchableOpacity
                      style={styles.calloutActionButton}
                      onPress={handleOpenLiveTracking}
                    >
                      <Text style={styles.calloutActionText}>
                        {localized('Open Live')}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      <View style={styles.topOverlay}>
        <View style={styles.topSummary}>
          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>{localized('Total')}</Text>
            <Text style={styles.summaryValue}>{fleetSummary.total}</Text>
          </View>

          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>{localized('Active')}</Text>
            <Text style={styles.summaryValue}>{fleetSummary.active}</Text>
          </View>

          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>{localized('Idle')}</Text>
            <Text style={styles.summaryValue}>{fleetSummary.idle}</Text>
          </View>

          <View style={styles.summaryPill}>
            <Text style={styles.summaryLabel}>{localized('Delayed')}</Text>
            <Text style={styles.summaryValue}>{fleetSummary.stale}</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {filters.map(filter => {
            const isSelected = activeFilter === filter.key;

            return (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(filter.key)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label} ({filterCounters[filter.key]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TouchableOpacity style={styles.recenterButton} onPress={fitToFleet}>
        <MaterialCommunityIcons
          name="crosshairs-gps"
          size={22}
          color={colors.primaryText}
        />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.overlayCenter}>
          <ActivityIndicator
            size="large"
            color={colors.primaryForeground}
          />
          <Text style={styles.overlayText}>
            {localized('Loading live fleet...')}
          </Text>
        </View>
      ) : null}

      {!loading && filteredTrucks.length === 0 ? (
        <View style={styles.emptyView}>
          <Text style={styles.emptyText}>
            {localized('No trucks found for this filter.')}
          </Text>
        </View>
      ) : null}

      {selectedTruck ? (
        <View style={styles.bottomCard}>
          <View style={styles.bottomCardHeader}>
            <View style={styles.bottomCardHeaderLeft}>
              <Text style={styles.bottomCardTitle}>
                {selectedTruck?.name ||
                  selectedTruck?.number ||
                  localized('Truck')}
              </Text>

              <Text style={styles.bottomCardSubtitle}>
                {localized('Plate')}: {selectedTruck?.licensePlate || '—'}
              </Text>
            </View>

            <TouchableOpacity onPress={() => setSelectedTruck(null)}>
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.primaryText}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.statusRow}>
            <MaterialCommunityIcons
              name="circle"
              size={10}
              color={getMarkerColor(getTruckLiveStatus(selectedTruck).key)}
            />
            <Text style={styles.statusText}>
              {localized(getTruckLiveStatus(selectedTruck).label)}
            </Text>
          </View>

          <Text style={styles.bottomCardInfo}>
            {localized('Driver')}: {selectedTruck?.currentDriverName || '—'}
          </Text>

          <Text style={styles.bottomCardInfo}>
            {localized('Trip Status')}: {selectedTruck?.tripStatus || '—'}
          </Text>

          <Text style={styles.bottomCardInfo}>
            {localized('Destination')}:{' '}
            {selectedTruck?.job?.destination?.title || '—'}
          </Text>

          <View style={styles.bottomCardActions}>
            {!!selectedTruck?.job ? (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleOpenJob}
                >
                  <Text style={styles.primaryButtonText}>
                    {localized('Open Job')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleOpenLiveTracking}
                >
                  <Text style={styles.secondaryButtonText}>
                    {localized('Live Tracking')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.noJobBadge}>
                <Text style={styles.noJobBadgeText}>
                  {localized('No active job')}
                </Text>
              </View>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default LiveFleetMapScreen;