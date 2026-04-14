import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import StatusTabs from '../../../../core/components/StatusTabs';
import useCarrierJobsList, {
  CarrierJobItem,
} from '../../../hooks/useCarrierJobsList';

type JobTabKey =
  | 'scheduled'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

const JOB_TABS = [
  {
    key: 'scheduled',
    label: 'Scheduled',
    icon: 'calendar-clock-outline',
    color: '#f59e0b',
  },
  {
    key: 'assigned',
    label: 'Assigned',
    icon: 'account-check-outline',
    color: '#3b82f6',
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    icon: 'truck-fast-outline',
    color: '#16a34a',
  },
  {
    key: 'completed',
    label: 'Completed',
    icon: 'check-circle-outline',
    color: '#8b5cf6',
  },
  {
    key: 'cancelled',
    label: 'Cancelled',
    icon: 'close-circle-outline',
    color: '#dc2626',
  },
];

const getInitialTab = (status?: string): JobTabKey => {
  if (status === 'assigned') return 'assigned';
  if (status === 'in_progress') return 'in_progress';
  if (status === 'completed') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'scheduled';
};

const getRouteLabel = (job: CarrierJobItem, localized: (key: string) => string) => {
  const origin =
    job?.origin?.title ||
    job?.origin?.name ||
    localized('Unknown origin');

  const destination =
    job?.destination?.title ||
    job?.destination?.name ||
    localized('Unknown destination');

  return `${origin} → ${destination}`;
};

const getDriverLabel = (
  job: CarrierJobItem,
  localized: (key: string) => string,
) => {
  const firstName = job?.assignedDriver?.firstName || '';
  const lastName = job?.assignedDriver?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    fullName ||
    job?.assignedDriverName ||
    job?.assignedDriverID ||
    localized('Not assigned')
  );
};

const CarrierJobsHomeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const [activeTab, setActiveTab] = useState<JobTabKey>(
    getInitialTab(route?.params?.initialStatus),
  );

  const { jobs, counters, loading } = useCarrierJobsList();

  useEffect(() => {
    setActiveTab(getInitialTab(route?.params?.initialStatus));
  }, [route?.params?.initialStatus]);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Jobs'),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, appearance, localized, theme]);

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => job?.status === activeTab);
  }, [jobs, activeTab]);

  const handleOpenJob = (job: CarrierJobItem) => {
    if (!job?.projectID || !job?.channelID) return;

    navigation.navigate('JobDetails', {
      job,
      projectID: job.projectID,
      channelID: job.channelID,
    });
  };

  const renderItem = ({ item }: { item: CarrierJobItem }) => {
    return (
      <Pressable
        style={styles.card}
        onPress={() => handleOpenJob(item)}
      >
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderTextBlock}>
            <Text style={styles.projectName}>
              {item?.projectName || localized('Project')}
            </Text>

            <Text style={styles.routeText}>
              {getRouteLabel(item, localized)}
            </Text>
          </View>

          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={theme.colors[appearance].secondaryText}
          />
        </View>

        <Text style={styles.metaText}>
          {localized('Status')}: {item?.status || '—'}
        </Text>

        <Text style={styles.metaText}>
          {localized('Driver')}: {getDriverLabel(item, localized)}
        </Text>

        <Text style={styles.metaText}>
          {localized('Truck')}: {item?.assignedTruckID || localized('Not assigned')}
        </Text>

        {item?.assignedTrailerID ? (
          <Text style={styles.metaText}>
            {localized('Trailer')}: {item.assignedTrailerID}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusTabs
        tabs={JOB_TABS}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as JobTabKey)}
        counters={counters}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {localized('No jobs found')}
            </Text>
          }
        />
      )}
    </View>
  );
};

export default CarrierJobsHomeScreen;