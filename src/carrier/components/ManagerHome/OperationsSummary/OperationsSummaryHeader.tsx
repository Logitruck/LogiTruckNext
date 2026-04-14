import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import useCarrierOperationsSummary from '../../../hooks/home/useCarrierOperationsSummary';

const OperationsSummaryHeader = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const {
    activeTripsCount,
    liveFleetCount,
    pendingInspectionsCount,
    offersInReviewCount,
  } = useCarrierOperationsSummary();

  const items = useMemo(
    () => [
      {
        key: 'trips',
        icon: 'truck-fast-outline',
        label: localized('Trips'),
        value: activeTripsCount,
        onPress: () =>
          navigation.navigate('CarrierTruckLiveTab', {
            initialFilter: 'active',
          }),
      },
      {
        key: 'fleet',
        icon: 'crosshairs-gps',
        label: localized('Fleet'),
        value: liveFleetCount,
        onPress: () =>
          navigation.navigate('CarrierTruckLiveTab', {
            initialFilter: 'all',
          }),
      },
      {
        key: 'checks',
        icon: 'clipboard-check-outline',
        label: localized('Checks'),
        value: pendingInspectionsCount,
        onPress: () =>
          navigation.navigate('CarrierInspectionsTab', {
            status: 'pending',
          }),
      },
      {
        key: 'offers',
        icon: 'file-document-outline',
        label: localized('Offers'),
        value: offersInReviewCount,
        onPress: () =>
          navigation.navigate('CarrierDealsTab', {
            screen: 'Deals',
            params: {
              screen: 'DealsHome',
              params: { status: 'ready' },
            },
          }),
      },
    ],
    [
      activeTripsCount,
      liveFleetCount,
      pendingInspectionsCount,
      offersInReviewCount,
      localized,
      navigation,
    ],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{localized('Operations Overview')}</Text>

      <View style={styles.summaryCard}>
        <View style={styles.row}>
          {items.map(item => (
            <TouchableOpacity
              key={item.key}
              style={styles.kpiItem}
              activeOpacity={0.75}
              onPress={item.onPress}
            >
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={18}
                  color={colors.primaryForeground}
                />
              </View>

              <Text style={styles.value}>{item.value}</Text>
              <Text style={styles.label}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export default OperationsSummaryHeader;