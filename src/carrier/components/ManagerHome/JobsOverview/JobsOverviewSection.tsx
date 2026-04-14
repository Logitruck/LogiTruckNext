import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import SectionHeader from '../shared/SectionHeader';
import JobStatusCard from './JobStatusCard';
import useCarrierJobsOverview from '../../../hooks/home/useCarrierJobsOverview';

const JobsOverviewSection = () => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { counters, loading } = useCarrierJobsOverview();

  const items = useMemo(
    () => [
      {
        key: 'scheduled',
        label: localized('Scheduled'),
        icon: 'calendar-clock-outline',
        color: '#f59e0b',
      },
      {
        key: 'assigned',
        label: localized('Assigned'),
        icon: 'account-check-outline',
        color: '#3b82f6',
      },
      {
        key: 'in_progress',
        label: localized('In Progress'),
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
    navigation.navigate('CarrierJobsTab', {
      screen: 'CarrierJobsHome',
      params: {
        initialStatus: status,
      },
    });
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title={localized('Jobs')}
        subtitle={localized('Daily execution across all projects')}
      />

      <View style={styles.grid}>
        {items.map(item => (
          <JobStatusCard
            key={item.key}
            label={item.label}
            value={counters[item.key as keyof typeof counters] || 0}
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

export default JobsOverviewSection;