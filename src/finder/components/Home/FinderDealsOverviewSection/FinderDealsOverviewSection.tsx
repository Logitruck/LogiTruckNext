import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader/SectionHeader';
import FinderDealStatusCard from './FinderDealStatusCard';
import useFinderDealsOverview from '../../../hooks/home/useFinderDealsOverview';

const FinderDealsOverviewSection = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { counts, loading } = useFinderDealsOverview();

  const items = useMemo(
    () => [
      {
        key: 'sending',
        label: localized('Sending'),
        icon: 'send',
        color: colors.red || '#dc2626',
      },
      {
        key: 'offered',
        label: localized('Offered'),
        icon: 'tag-outline',
        color: '#2980b9',
      },
      {
        key: 'to_sign',
        label: localized('To Sign'),
        icon: 'pen',
        color: '#8e44ad',
      },
      {
        key: 'execution',
        label: localized('Execution'),
        icon: 'play-circle-outline',
        color: '#f39c12',
      },
    ],
    [colors.red, localized],
  );

  const handleOpenStatus = (status: string) => {
    navigation.navigate('FinderDealsTab', {
      screen: 'Deals',
      params: { status },
    });
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Deals')}
        subtitle={localized('Requests and offers pipeline')}
      />

      <View style={styles.grid}>
        {items.map(item => (
          <FinderDealStatusCard
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

export default FinderDealsOverviewSection;