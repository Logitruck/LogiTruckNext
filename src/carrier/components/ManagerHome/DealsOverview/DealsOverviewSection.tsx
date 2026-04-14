import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader';
import DealStatusCard from './DealStatusCard';
import useCarrierDealsOverview from '../../../hooks/home/useCarrierDealsOverview';

const DealsOverviewSection = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { counts, loading } = useCarrierDealsOverview();

  const items = useMemo(
    () => [
      {
        key: 'pending',
        label: localized('New'),
        icon: 'email-outline',
        color: colors.red || '#dc2626',
      },
      {
        key: 'ready',
        label: localized('Review'),
        icon: 'file-document-edit-outline',
        color: '#f59e0b',
      },
      {
        key: 'to_sign',
        label: localized('To Sign'),
        icon: 'draw-pen',
        color: '#8e44ad',
      },
      {
        key: 'execution',
        label: localized('Execution'),
        icon: 'truck-fast-outline',
        color: colors.green || '#16a34a',
      },
    ],
    [colors.green, colors.red, localized],
  );

  const handleOpenStatus = (status: string) => {
    navigation.navigate('CarrierDealsTab', {
      screen: 'Deals',
      params: {
        screen: 'DealsHome',
        params: { status },
      },
    });
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Deals')}
        subtitle={localized('Commercial and contract pipeline')}
      />

      <View style={styles.grid}>
        {items.map(item => (
          <DealStatusCard
            key={item.key}
            label={item.label}
            value={counts[item.key as keyof typeof counts] || 0}
            icon={item.icon}
            color={item.color}
            loading={loading}
            onPress={() => handleOpenStatus(item.key)}
          />
        ))}
      </View>
    </View>
  );
};

export default DealsOverviewSection;