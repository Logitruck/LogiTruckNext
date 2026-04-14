import React, { useLayoutEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';

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

const JobDetailsScreen = ({ route, navigation }: any) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const { job } = route.params || {};

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

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
  }, [navigation, appearance, job?.name, localized, theme]);

  const originLabel = job?.pickupAlias || job?.origin?.title || '-';
  const destinationLabel = job?.dropoffAlias || job?.destination?.title || '-';

  const scheduledAt = job?.scheduledAt ? formatDateValue(job.scheduledAt) : '-';

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
            value={scheduledAt}
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

        <LabelRow
          icon="signature-freehand"
          label={localized('Receiver Signature')}
          value={
            job?.delivery?.signature
              ? localized('Captured')
              : localized('Pending')
          }
        />
      </View>
    </ScrollView>
  );
};

export default JobDetailsScreen;