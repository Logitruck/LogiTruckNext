import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader';
import InspectionStatusCard from './InspectionStatusCard';
import useCarrierInspectionsOverview from '../../../hooks/home/useCarrierInspectionsOverview';

const InspectionsOverviewSection = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { counts, loading } = useCarrierInspectionsOverview();

  const items = useMemo(
    () => [
      {
        key: 'pending',
        label: localized('Pending'),
        icon: 'clipboard-clock-outline',
        color: '#f59e0b',
      },
      {
        key: 'under_review',
        label: localized('Under Review'),
        icon: 'eye-check-outline',
        color: '#3b82f6',
      },
      {
        key: 'approved',
        label: localized('Approved'),
        icon: 'check-circle-outline',
        color: colors.green || '#16a34a',
      },
    ],
    [colors.green, localized],
  );

  const handleOpenInspections = (status: string) => {
  navigation.navigate('CarrierInspectionsTab', {
  screen: 'Inspections',
  params: {
    screen: 'InspectionsHome',
    params: {
      status,
    },
  },
});
};

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Inspections')}
        subtitle={localized('Vehicle operational compliance')}
      />

      <View style={styles.row}>
        {items.map(item => (
          <InspectionStatusCard
            key={item.key}
            label={item.label}
            value={counts[item.key as keyof typeof counts] || 0}
            icon={item.icon}
            color={item.color}
            loading={loading}
            onPress={() => handleOpenInspections(item.key)}
          />
        ))}
      </View>
    </View>
  );
};

export default InspectionsOverviewSection;