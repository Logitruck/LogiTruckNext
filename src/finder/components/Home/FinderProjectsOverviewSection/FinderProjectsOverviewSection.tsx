import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader/SectionHeader';
import FinderProjectStatusCard from './FinderProjectStatusCard';
import useFinderProjectsOverview from '../../../hooks/home/useFinderProjectsOverview';

const FinderProjectsOverviewSection = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { counts, loading } = useFinderProjectsOverview();

  const items = useMemo(
    () => [
      {
        key: 'setup',
        label: localized('Setup'),
        icon: 'cog-outline',
        color: '#f59e0b',
      },
      {
        key: 'execution',
        label: localized('Execution'),
        icon: 'truck-fast-outline',
        color: colors.green || '#16a34a',
      },
      {
        key: 'completed',
        label: localized('Completed'),
        icon: 'check-circle-outline',
        color: '#8b5cf6',
      },
    ],
    [colors.green, localized],
  );

  const handleOpenStatus = (status: string) => {
    navigation.navigate('FinderProjectsTab', {
      screen: 'ProjectsMain',
      params: {
        screen: 'ProjectsHome',
        params: { status },
      },
    });
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Projects')}
        subtitle={localized('Operational progress of active accounts')}
      />

      <View style={styles.row}>
        {items.map(item => (
          <FinderProjectStatusCard
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

export default FinderProjectsOverviewSection;