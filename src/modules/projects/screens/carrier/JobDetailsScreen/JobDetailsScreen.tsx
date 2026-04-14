import React, { useLayoutEffect, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useCompletedPolyline from '../../../hooks/carrier/useCompletedPolyline';
import useLiveJobLocation from '../../../hooks/carrier/useLiveJobLocation';

type LabelRowProps = {
  icon: string;
  label: string;
  value?: string;
};

const LabelRow = ({ icon, label, value }: LabelRowProps) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <View style={styles.labelRow}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        style={styles.labelIcon}
      />
      <Text style={styles.labelText}>
        {label}: <Text style={styles.valueText}>{value || '-'}</Text>
      </Text>
    </View>
  );
};

const formatDateValue = (value: any) => {
  if (!value) return '-';

  if (value?.toDate) {
    return value.toDate().toLocaleString();
  }

  if (value?.seconds) {
    return new Date(value.seconds * 1000).toLocaleString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
};

const formatCurrency = (value?: number | null): string => {
  const safeValue = Number(value);
  if (!isFinite(safeValue)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeValue);
};

export const JobDetailsScreen = ({ route, navigation }: any) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { job } = route.params || {};

  const { polylineCoords } = useCompletedPolyline(
    job?.channelID,
    job?.projectID,
    job?.id,
  );

  const { driverLocation: liveDriverLocation } = useLiveJobLocation(
    job?.channelID,
    job?.projectID,
    job?.id,
  );

  const mapRef = useRef<MapView | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: job?.name || localized('Job Details'),
      headerBackTitleVisible: false,
      headerLeft: () => (
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.primaryText}
          style={{ marginLeft: 16 }}
          onPress={() => navigation.goBack()}
        />
      ),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, appearance, job?.name, localized, theme, colors.primaryText, colors.primaryBackground]);

  useEffect(() => {
    if (
      mapRef.current &&
      job?.status === 'in_progress' &&
      liveDriverLocation?.latitude
    ) {
      mapRef.current.animateToRegion(
        {
          latitude: liveDriverLocation.latitude,
          longitude: liveDriverLocation.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000,
      );
    }
  }, [liveDriverLocation, job?.status]);

  const originLabel = job?.pickupAlias || job?.origin?.title || '-';
  const destinationLabel = job?.dropoffAlias || job?.destination?.title || '-';

  const truckLabel =
    job?.assignedTruck?.licensePlate ||
    job?.assignedTruck?.name ||
    '-';

  const driverLabel = job?.assignedDriver
    ? `${job.assignedDriver?.firstName || ''} ${job.assignedDriver?.lastName || ''}`.trim()
    : '-';

  const trailerLabel =
    job?.assignedTrailer?.licensePlate ||
    job?.assignedTrailer?.name ||
    '-';

  const dispatcherLabel = job?.assignedDispatcher
    ? `${job.assignedDispatcher?.firstName || ''} ${job.assignedDispatcher?.lastName || ''}`.trim()
    : '-';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{job?.name || '-'}</Text>

        <LabelRow
          icon="information-outline"
          label={localized('Status')}
          value={job?.status}
        />
        <LabelRow
          icon="map-marker-path"
          label={localized('Route')}
          value={`#${job?.routeIndex ?? '-'} / #${job?.tripIndex ?? '-'}`}
        />
        <LabelRow
          icon="map-marker-outline"
          label={localized('Origin')}
          value={originLabel}
        />
        <LabelRow
          icon="flag-checkered"
          label={localized('Destination')}
          value={destinationLabel}
        />
        <LabelRow
          icon="cash"
          label={localized('Price per Trip')}
          value={formatCurrency(job?.pricePerTrip ?? 0)}
        />

        {job?.scheduledAt ? (
          <LabelRow
            icon="calendar-clock"
            label={localized('Scheduled At')}
            value={formatDateValue(job.scheduledAt)}
          />
        ) : null}

        {job?.startedAt ? (
          <LabelRow
            icon="play-circle-outline"
            label={localized('Started At')}
            value={formatDateValue(job.startedAt)}
          />
        ) : null}

        {job?.pickupContact ? (
          <LabelRow
            icon="phone-outline"
            label={localized('Pickup Contact')}
            value={job.pickupContact}
          />
        ) : null}

        {job?.dropoffContact ? (
          <LabelRow
            icon="phone-check-outline"
            label={localized('Dropoff Contact')}
            value={job.dropoffContact}
          />
        ) : null}

        {job?.pickupInstructions ? (
          <LabelRow
            icon="note-text-outline"
            label={localized('Pickup Instructions')}
            value={job.pickupInstructions}
          />
        ) : null}

        {job?.dropoffInstructions ? (
          <LabelRow
            icon="note-text"
            label={localized('Dropoff Instructions')}
            value={job.dropoffInstructions}
          />
        ) : null}

        {job?.notes ? (
          <LabelRow
            icon="text-box-outline"
            label={localized('Notes')}
            value={job.notes}
          />
        ) : null}
      </View>

      {job?.status === 'completed' && polylineCoords?.length > 1 ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: polylineCoords[0].latitude,
              longitude: polylineCoords[0].longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            <Polyline
              coordinates={polylineCoords}
              strokeWidth={4}
              strokeColor={colors.primary}
            />
            <Marker
              coordinate={polylineCoords[0]}
              title={localized('Start')}
              pinColor="green"
            />
            <Marker
              coordinate={polylineCoords[polylineCoords.length - 1]}
              title={localized('End')}
              pinColor="red"
            />
          </MapView>
        </View>
      ) : job?.status === 'in_progress' && liveDriverLocation?.latitude ? (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: liveDriverLocation.latitude,
              longitude: liveDriverLocation.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
          >
            <Marker
              coordinate={liveDriverLocation}
              title={localized('Current Truck Location')}
              pinColor="blue"
            />
          </MapView>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>
          {localized('Assigned Resources')}
        </Text>

        <LabelRow
          icon="truck-outline"
          label={localized('Truck')}
          value={truckLabel}
        />
        <LabelRow
          icon="account"
          label={localized('Driver')}
          value={driverLabel}
        />
        <LabelRow
          icon="train-car"
          label={localized('Trailer')}
          value={trailerLabel}
        />
        <LabelRow
          icon="account-tie"
          label={localized('Dispatcher')}
          value={dispatcherLabel}
        />

        <Pressable
          onPress={() =>
            navigation.navigate('AssignJobModal', {
              job,
              channelID: job?.channelID,
              projectID: job?.projectID,
            })
          }
          style={styles.reassignButton}
        >
          <Text style={styles.reassignText}>
            {localized('Reassign')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeader}>
          {localized('Delivery Status')}
        </Text>

        <LabelRow
          icon="truck-delivery-outline"
          label={localized('Picked Up')}
          value={
            job?.delivery?.pickedUp
              ? formatDateValue(job.delivery.pickedUp)
              : localized('Not yet')
          }
        />

        <LabelRow
          icon="package-check"
          label={localized('Delivered')}
          value={
            job?.delivery?.delivered
              ? formatDateValue(job.delivery.delivered)
              : localized('Not yet')
          }
        />

        {job?.pickupTicket?.url ? (
          <Pressable
            onPress={() => Linking.openURL(job.pickupTicket.url)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              {localized('View Pickup Ticket')}
            </Text>
          </Pressable>
        ) : null}

        {job?.deliveryTicket?.url ? (
          <Pressable
            onPress={() => Linking.openURL(job.deliveryTicket.url)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              {localized('View Delivery Ticket')}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default JobDetailsScreen;