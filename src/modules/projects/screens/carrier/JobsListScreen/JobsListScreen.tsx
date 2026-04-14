import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import StatusTabs from '../../../../../core/components/StatusTabs';
import useProjectJobs from '../../../hooks/carrier/useCarrierProjectJobs';

type JobItemProps = {
  job: any;
  onAssignPress: (job: any) => void;
  onViewDetails: (job: any) => void;
  onStartPress: (job: any) => void;
  localized: (key: string) => string;
};

const formatCurrency = (value?: number | null): string => {
  const safeValue = Number(value);
  if (!isFinite(safeValue)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeValue);
};

const JobItem = ({
  job,
  onAssignPress,
  onViewDetails,
  onStartPress,
  localized,
}: JobItemProps) => {
  const title =
    job?.pickupAlias?.trim() && job?.dropoffAlias?.trim()
      ? `${job.pickupAlias} → ${job.dropoffAlias}`
      : `${job?.origin?.title || localized('Unknown origin')} → ${
          job?.destination?.title || localized('Unknown destination')
        }`;

  return (
    <View
      style={{
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{job?.name}</Text>

        <Text style={{ marginTop: 4 }}>{title}</Text>

        <Text style={{ color: '#888', marginTop: 4 }}>
          {localized('Status')}: {job?.status}
        </Text>

        <Text style={{ color: '#888', marginTop: 2 }}>
          {localized('Route')} #{job?.routeIndex ?? '—'} · {localized('Trip')} #{job?.tripIndex ?? '—'}
        </Text>

        <Text style={{ color: '#888', marginTop: 2 }}>
          {localized('Price per Trip')}: {formatCurrency(job?.pricePerTrip ?? 0)}
        </Text>

        {job?.status === 'assigned' && job?.assignedDriverID ? (
          <Pressable onPress={() => onStartPress(job)} style={{ marginTop: 8 }}>
            <View
              style={{
                backgroundColor: '#2ecc71',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                alignSelf: 'flex-start',
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                {localized('Start Job')}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {(job?.status === 'scheduled' || job?.status === 'assigned') && (
          <Pressable
            onPress={() => onAssignPress(job)}
            style={{ marginHorizontal: 6 }}
          >
            <MaterialCommunityIcons
              name="account-plus"
              size={22}
              color="#e67e22"
            />
          </Pressable>
        )}

        <Pressable
          onPress={() => onViewDetails(job)}
          style={{ marginHorizontal: 6 }}
        >
          <MaterialCommunityIcons
            name="eye-outline"
            size={22}
            color="#3498db"
          />
        </Pressable>
      </View>
    </View>
  );
};

type ProjectJobsListProps = {
  jobs: any[];
  onAssignPress: (job: any) => void;
  onViewDetails: (job: any) => void;
  onStartPress: (job: any) => void;
  localized: (key: string) => string;
};

const ProjectJobsList = ({
  jobs,
  onAssignPress,
  onViewDetails,
  onStartPress,
  localized,
}: ProjectJobsListProps) => {
  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <JobItem
          job={item}
          onAssignPress={onAssignPress}
          onViewDetails={onViewDetails}
          onStartPress={onStartPress}
          localized={localized}
        />
      )}
      ListEmptyComponent={
        <Text style={{ padding: 16 }}>{localized('No jobs found')}</Text>
      }
    />
  );
};

const JobsListScreen = ({ route, navigation }: any) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const { project } = route.params || {};

  const { jobs, loading, startJob, counters } = useProjectJobs(
    project?.channelID,
    project?.id,
  );

  const [activeTab, setActiveTab] = useState('scheduled');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Jobs'),
    });
  }, [navigation, localized]);

  const handleStartJob = async (job: any) => {
    await startJob(job.channelID, job.projectID, job.id, job.assignedDriverID);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job: any) => job.status === activeTab);
  }, [jobs, activeTab]);

  const TABS = [
    {
      key: 'scheduled',
      label: 'Scheduled',
      icon: 'calendar-clock',
      color: '#f39c12',
    },
    {
      key: 'assigned',
      label: 'Assigned',
      icon: 'account-check',
      color: '#8e44ad',
    },
    {
      key: 'in_progress',
      label: 'In Progress',
      icon: 'progress-clock',
      color: '#3498db',
    },
    {
      key: 'completed',
      label: 'Completed',
      icon: 'check-circle-outline',
      color: '#2ecc71',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      icon: 'cancel',
      color: '#e74c3c',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusTabs
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counters={counters}
      />

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 24 }}
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      ) : (
        <ProjectJobsList
          jobs={filteredJobs}
          onAssignPress={(job) => {
            navigation.navigate('AssignJobModal', {
              job,
              channelID: project?.channelID,
              projectID: project?.id,
            });
          }}
          onViewDetails={(job) => {
            navigation.navigate('JobDetails', { job, role: 'carrier' });
          }}
          onStartPress={handleStartJob}
          localized={localized}
        />
      )}
    </View>
  );
};

export default JobsListScreen;