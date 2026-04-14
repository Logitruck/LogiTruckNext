import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
} from 'react-native';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';
import useSaveProjectData from '../../../../hooks/shared/useSaveProjectData';

type RouteItem = {
  id: string;
  origin?: { title?: string };
  destination?: { title?: string };
  pickupAlias?: string;
  dropoffAlias?: string;
  pickupContact?: string;
  dropoffContact?: string;
  pickupInstructions?: string;
  dropoffInstructions?: string;
  cargo?: {
    trips?: number;
  };
  pricePerTrip?: number;
  tripsOffered?: number;
  notes?: string;
};

type Props = {
  data: any;
  navigation: any;
};

const formatCurrency = (value?: number | null): string => {
  const safeValue = Number(value);

  if (!isFinite(safeValue)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeValue);
};

const SetupStepReview = ({ data, navigation }: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const { markSetupFlag } = useSaveProjectData();

  const routes: RouteItem[] = useMemo(
    () => (Array.isArray(data?.routes) ? data.routes : []),
    [data?.routes],
  );

  const summary = useMemo(() => {
    const totalRoutes = routes.length;

    const totalTrips = routes.reduce((sum, route) => {
      return sum + Number(route?.tripsOffered ?? route?.cargo?.trips ?? 0);
    }, 0);

    const totalOfferAmount = routes.reduce((sum, route) => {
      return (
        sum +
        Number(route?.pricePerTrip ?? 0) *
          Number(route?.tripsOffered ?? route?.cargo?.trips ?? 0)
      );
    }, 0);

    return {
      totalRoutes,
      totalTrips,
      totalOfferAmount,
    };
  }, [routes]);

  const handleConfirm = async () => {
    try {
      await markSetupFlag({
        channelID: data.channelID,
        projectID: data.id,
        role: 'finder',
      });

      navigation.navigate('ProjectsHome');
    } catch (error) {
      console.error('🔥 Error confirming finder project:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not confirm the project.'),
      );
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.sectionTitle}>
        {localized('Project Summary')}
      </Text>

      <Text style={styles.label}>{localized('Project Name')}:</Text>
      <Text style={styles.itemText}>{data?.name || '-'}</Text>

      <Text style={styles.label}>{localized('Total Routes')}:</Text>
      <Text style={styles.itemText}>{summary.totalRoutes}</Text>

      <Text style={styles.label}>{localized('Total Trips')}:</Text>
      <Text style={styles.itemText}>{summary.totalTrips}</Text>

      <Text style={styles.label}>{localized('Accepted Offer Total')}:</Text>
      <Text style={styles.itemText}>
        {formatCurrency(summary.totalOfferAmount)}
      </Text>

      <Text style={styles.sectionTitle}>
        {localized('Routes Detail')}
      </Text>

      {routes.map((route, index) => (
        <View key={route.id || index} style={styles.routeCard}>
          <Text style={styles.routeTitle}>
            {localized('Route')} {index + 1}: {route?.origin?.title || '-'} →{' '}
            {route?.destination?.title || '-'}
          </Text>

          <Text style={styles.label}>{localized('Pickup Alias')}:</Text>
          <Text style={styles.itemText}>{route?.pickupAlias || '-'}</Text>

          <Text style={styles.label}>{localized('Dropoff Alias')}:</Text>
          <Text style={styles.itemText}>{route?.dropoffAlias || '-'}</Text>

          <Text style={styles.label}>{localized('Pickup Contact')}:</Text>
          <Text style={styles.itemText}>{route?.pickupContact || '-'}</Text>

          <Text style={styles.label}>{localized('Dropoff Contact')}:</Text>
          <Text style={styles.itemText}>{route?.dropoffContact || '-'}</Text>

          <Text style={styles.label}>{localized('Pickup Instructions')}:</Text>
          <Text style={styles.itemText}>
            {route?.pickupInstructions || '-'}
          </Text>

          <Text style={styles.label}>{localized('Dropoff Instructions')}:</Text>
          <Text style={styles.itemText}>
            {route?.dropoffInstructions || '-'}
          </Text>

          <Text style={styles.label}>{localized('Trips')}:</Text>
          <Text style={styles.itemText}>
            {route?.tripsOffered ?? route?.cargo?.trips ?? '-'}
          </Text>

          <Text style={styles.label}>{localized('Price per Trip')}:</Text>
          <Text style={styles.itemText}>
            {route?.pricePerTrip != null
              ? formatCurrency(route.pricePerTrip)
              : '-'}
          </Text>

          <Text style={styles.label}>{localized('Notes')}:</Text>
          <Text style={styles.itemText}>{route?.notes || '-'}</Text>
        </View>
      ))}

      <Pressable style={styles.confirmButton} onPress={handleConfirm}>
        <Text style={styles.confirmButtonText}>
          {localized('Confirm Finder Setup')}
        </Text>
      </Pressable>
    </View>
  );
};

export default SetupStepReview;