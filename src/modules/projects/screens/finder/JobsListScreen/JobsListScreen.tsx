import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import StatusTabs from '../../../../../core/components/StatusTabs';
import useProjectJobs from '../../../hooks/finder/useFinderProjectJobs';

type JobItemProps = {
  job: any;
  onSchedulePress: (job: any) => void;
  onViewDetails: (job: any) => void;
  localized: (key: string) => string;
  appearance: 'light' | 'dark';
  theme: any;
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
  onSchedulePress,
  onViewDetails,
  localized,
  appearance,
  theme,
}: JobItemProps) => {
  const title =
    job?.pickupAlias?.trim() && job?.dropoffAlias?.trim()
      ? `${job.pickupAlias} → ${job.dropoffAlias}`
      : `${job.origin?.title || localized('Unknown origin')} → ${
          job.destination?.title || localized('Unknown destination')
        }`;

  return (
    <View
      style={{
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
      }}
    >
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={{ fontWeight: '700', fontSize: 16 }}>{job.name}</Text>

        <Text style={{ marginTop: 4 }}>{title}</Text>

        <Text style={{ color: '#888', marginTop: 4 }}>
          {localized('Status')}: {job.status}
        </Text>

        <Text style={{ color: '#888', marginTop: 2 }}>
          {localized('Route')} #{job.routeIndex ?? '—'} · {localized('Trip')} #{job.tripIndex ?? '—'}
        </Text>

        <Text style={{ color: '#888', marginTop: 2 }}>
          {localized('Price per Trip')}: {formatCurrency(job?.pricePerTrip ?? 0)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {job.status === 'pending' && (
          <Pressable
            onPress={() => onSchedulePress(job)}
            style={{ marginHorizontal: 6 }}
          >
            <MaterialCommunityIcons
              name="calendar-clock"
              size={22}
              color="#2ecc71"
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
  onSchedulePress: (job: any) => void;
  onViewDetails: (job: any) => void;
  localized: (key: string) => string;
  appearance: 'light' | 'dark';
  theme: any;
};

const ProjectJobsList = ({
  jobs,
  onSchedulePress,
  onViewDetails,
  localized,
  appearance,
  theme,
}: ProjectJobsListProps) => {
  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <JobItem
          job={item}
          onSchedulePress={onSchedulePress}
          onViewDetails={onViewDetails}
          localized={localized}
          appearance={appearance}
          theme={theme}
        />
      )}
      ListEmptyComponent={
        <Text style={{ padding: 16 }}>{localized('No jobs found')}</Text>
      }
      showsVerticalScrollIndicator={false}
    />
  );
};

const JobsListScreen = ({ route, navigation }: any) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const { project } = route.params;
  const { jobs, loading, counters, scheduleJob } = useProjectJobs(
    project.channelID,
    project.id,
  );

  const [activeTab, setActiveTab] = useState('pending');
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Jobs'),
    });
  }, [navigation, localized]);

  const handleSchedule = async () => {
    if (selectedJob) {
      await scheduleJob(selectedJob.id, selectedDate, notes);
      setShowScheduleModal(false);
      setSelectedJob(null);
      setNotes('');
      setSelectedDate(new Date());
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job: any) => job.status === activeTab);
  }, [jobs, activeTab]);

 const TABS = [
  {
    key: 'pending',
    label: 'Pending',
    icon: 'clock-outline',
    color: '#f39c12',
  },
  {
    key: 'scheduled',
    label: 'Scheduled',
    icon: 'calendar-check',
    color: '#8e44ad',
  },
  {
    key: 'assigned',
    label: 'Assigned',
    icon: 'truck-check-outline',
    color: '#16a085',
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
          onSchedulePress={(job) => {
            setSelectedJob(job);
            setShowScheduleModal(true);
          }}
          onViewDetails={(job) => {
            navigation.navigate('JobDetails', { job, role: 'finder' });
          }}
          localized={localized}
          appearance={appearance}
          theme={theme}
        />
      )}

      <Modal visible={showScheduleModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalLabel}>
              {localized('Estimated Start Date')}
            </Text>

            <Pressable
              style={styles.dateInputContainer}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateInputText}>
                {selectedDate.toDateString()}
              </Text>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                mode="date"
                display={Platform.OS === 'ios' ? 'default' : 'default'}
                value={selectedDate}
                onChange={(_, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            )}

            <Text style={styles.modalLabel}>
              {localized('Notes (optional)')}
            </Text>

            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder={localized('Any special instructions')}
              placeholderTextColor={theme.colors[appearance].secondaryText}
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable onPress={() => setShowScheduleModal(false)}>
                <Text style={styles.cancelText}>{localized('Cancel')}</Text>
              </Pressable>

              <Pressable onPress={handleSchedule}>
                <Text style={styles.confirmText}>{localized('Confirm')}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default JobsListScreen;