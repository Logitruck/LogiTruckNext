import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader';
import LiveTruckOperationCard from './LiveTruckOperationCard';
import useCarrierLiveOperations from '../../../hooks/home/useCarrierLiveOperations';

const LiveOperationsSection = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const { trucks, summary, loading } = useCarrierLiveOperations();

  const handleOpenLiveFleet = () => {
    navigation.navigate('CarrierTruckLiveTab');
  };

  if (!loading && trucks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Live Operations')}
        subtitle={localized('Units active right now')}
      />

      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>{localized('Active')}</Text>
          <Text style={styles.summaryChipValue}>{summary.active}</Text>
        </View>

        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipLabel}>{localized('Delayed')}</Text>
          <Text style={styles.summaryChipValue}>{summary.delayed}</Text>
        </View>

       

        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.summaryLinkChip}
          onPress={handleOpenLiveFleet}
        >
          <Text style={styles.summaryLinkText}>
            {localized('Open Map')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.operationsScrollWrapper}>
        <ScrollView
          style={styles.operationsScroll}
          contentContainerStyle={styles.operationsList}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {trucks.map((truck: any) => (
            <LiveTruckOperationCard
              key={truck?.id || truck?.vehicleID || Math.random().toString()}
              truck={truck}
            />
          ))}
        </ScrollView>
      </View>

      {trucks.length > 0 ? (
        <TouchableOpacity
          style={styles.viewMoreButton}
          onPress={handleOpenLiveFleet}
        >
          <Text style={styles.viewMoreText}>
            {localized('View all active units')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default LiveOperationsSection;