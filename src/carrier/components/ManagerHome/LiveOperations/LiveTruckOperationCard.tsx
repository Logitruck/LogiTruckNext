import React, { useMemo } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';

type Props = {
  truck: any;
};

const LiveTruckOperationCard = ({ truck }: Props) => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const job = truck?.job || null;

  const tripStatusLabel = useMemo(() => {
    switch (truck?.tripStatus) {
      case 'heading_to_pickup':
        return localized('Heading to Pickup');
      case 'arrived_at_pickup':
        return localized('Arrived at Pickup');
      case 'en_route':
      case 'in_progress':
        return localized('In Progress');
      case 'en_route_to_dropoff':
        return localized('Heading to Dropoff');
      case 'arrived_at_dropoff':
        return localized('Arrived at Dropoff');
      case 'delayed':
        return localized('Delayed');
      default:
        return localized('Active');
    }
  }, [localized, truck?.tripStatus]);

  const statusColor = useMemo(() => {
    switch (truck?.tripStatus) {
      case 'delayed':
        return '#f59e0b';
      case 'in_progress':
      case 'en_route':
      case 'en_route_to_dropoff':
      case 'heading_to_pickup':
      case 'arrived_at_pickup':
      case 'arrived_at_dropoff':
        return colors.green || '#16a34a';
      default:
        return colors.primaryForeground;
    }
  }, [colors.green, colors.primaryForeground, truck?.tripStatus]);

  const driverName =
    truck?.currentDriverName ||
    [
      truck?.currentDriver?.firstName || '',
      truck?.currentDriver?.lastName || '',
    ]
      .join(' ')
      .trim() ||
    '—';

  const destinationLabel =
    job?.destination?.title ||
    job?.destination?.name ||
    '—';

  const truckLabel =
    truck?.name || truck?.number || truck?.vehicleID || localized('Truck');

  const handleOpenTracking = () => {
  navigation.navigate('CarrierTruckLiveTab', {
  screen: 'LiveTruck',
  params: {
    screen: 'TruckLiveDetail',
    params: { truck },
  },
});
};

  const handleOpenJob = () => {
    if (!job) return;

    navigation.navigate('CarrierProjectsTab', {
      screen: 'ProjectsCarrierMain',
      params: {
        screen: 'JobDetails',
        params: { job },
      },
    });
  };

  return (
    <View style={styles.operationCard}>
      <View style={styles.operationTopRow}>
        <View style={styles.operationTitleBlock}>
          <Text style={styles.operationTitle}>{truckLabel}</Text>

          <View style={styles.operationStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: statusColor },
              ]}
            />
            <Text style={styles.operationStatusText}>
              {tripStatusLabel}
            </Text>
          </View>
        </View>

        <MaterialCommunityIcons
          name="truck-fast-outline"
          size={22}
          color={statusColor}
        />
      </View>

      <Text style={styles.operationMeta}>
        {localized('Driver')}: {driverName}
      </Text>

      <Text style={styles.operationMeta}>
        {localized('Destination')}: {destinationLabel}
      </Text>

      <View style={styles.operationActionsRow}>
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handleOpenTracking}
        >
          <MaterialCommunityIcons
            name="map-search-outline"
            size={18}
            color={colors.buttonText}
          />
          <Text style={styles.primaryActionText}>
            {localized('View Tracking')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionButton}
          onPress={handleOpenJob}
          disabled={!job}
        >
          <MaterialCommunityIcons
            name="briefcase-outline"
            size={18}
            color={colors.primaryText}
          />
          <Text style={styles.secondaryActionText}>
            {localized('Job')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LiveTruckOperationCard;