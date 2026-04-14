import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useCarrierProjectJobs from '../../../hooks/carrier/useCarrierProjectJobs';
import useProjectDetails from '../../../hooks/shared/useProjectDetails';

const formatCurrency = (value?: number | null): string => {
  const safeValue = Number(value);
  if (!isFinite(safeValue)) return '$0.00';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(safeValue);
};

const getVehicleLabel = (vehicle: any) => {
  const primary =
    vehicle?.number?.trim() ||
    vehicle?.name?.trim() ||
    vehicle?.licensePlate?.trim() ||
    vehicle?.id ||
    '-';

  const secondary = vehicle?.licensePlate?.trim();

  if (secondary && secondary !== primary) {
    return `${primary} • ${secondary}`;
  }

  return primary;
};

const getVehicleMeta = (vehicle: any) => {
  const metaParts = [vehicle?.make, vehicle?.model, vehicle?.year].filter(Boolean);

  if (metaParts.length > 0) {
    return metaParts.join(' • ');
  }

  return vehicle?.licensePlate || '-';
};

const getPersonLabel = (person: any) => {
  return `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || '-';
};

const getPersonMeta = (person: any) => {
  return person?.email || person?.phoneNumber || '-';
};

const SelectCard = ({
  label,
  value,
  selected,
  onPress,
}: {
  label: string;
  value?: string;
  selected?: boolean;
  onPress: () => void;
}) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <Pressable
      style={[styles.selectCard, selected ? styles.selectCardSelected : null]}
      onPress={onPress}
    >
      <Text style={styles.selectCardLabel}>{label}</Text>
      <Text style={styles.selectCardValue}>{value || '-'}</Text>
    </Pressable>
  );
};

const AssignJobModalScreen = ({ route, navigation }: any) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const {
    job,
    channelID: routeChannelID,
    projectID: routeProjectID,
    project: initialProject,
  } = route.params || {};

  const channelID = routeChannelID || initialProject?.channelID || job?.channelID;
  const projectID = routeProjectID || initialProject?.id || job?.projectID;

  const { project, loading } = useProjectDetails(channelID, projectID);
  const { assignJob } = useCarrierProjectJobs(channelID, projectID);

  const [driverID, setDriverID] = useState(job?.assignedDriverID || '');
  const [truckID, setTruckID] = useState(job?.assignedTruckID || '');
  const [trailerID, setTrailerID] = useState(job?.assignedTrailerID || '');
  const [dispatcherID, setDispatcherID] = useState(
    job?.assignedDispatcherID || '',
  );
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Assign Job'),
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
      headerLeft: () => (
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.primaryText}
          style={{ marginLeft: 16 }}
          onPress={() => navigation.goBack()}
        />
      ),
    });
  }, [navigation, localized, theme, appearance]);

  const drivers = Array.isArray(project?.carrierPersonnel?.drivers)
    ? project.carrierPersonnel.drivers
    : [];

  const dispatchers = Array.isArray(project?.carrierPersonnel?.dispatchers)
    ? project.carrierPersonnel.dispatchers
    : [];

  const trucks = Array.isArray(project?.carrierResources?.trucks)
    ? project.carrierResources.trucks
    : [];

  const trailers = Array.isArray(project?.carrierResources?.trailers)
    ? project.carrierResources.trailers
    : [];

  const selectedDriver = useMemo(
    () =>
      drivers.find(
        (item: any) => item.userID === driverID || item.id === driverID,
      ),
    [drivers, driverID],
  );

  const selectedTruck = useMemo(
    () => trucks.find((item: any) => item.id === truckID),
    [trucks, truckID],
  );

  const selectedTrailer = useMemo(
    () => trailers.find((item: any) => item.id === trailerID),
    [trailers, trailerID],
  );

  const selectedDispatcher = useMemo(
    () =>
      dispatchers.find(
        (item: any) => item.userID === dispatcherID || item.id === dispatcherID,
      ),
    [dispatchers, dispatcherID],
  );

  const handleAssign = async () => {
    if (!job?.id || !driverID || !truckID || !dispatcherID) {
      Alert.alert(
        localized('Error'),
        localized('Driver, truck and dispatcher are required.'),
      );
      return;
    }

    try {
      setSaving(true);

await assignJob(job.id, driverID, truckID, trailerID, dispatcherID);

      Alert.alert(
        localized('Success'),
        localized('Job assigned successfully'),
      );

      navigation.goBack();
    } catch (error) {
      console.error('❌ Error assigning job:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not assign the job'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading || !project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      </SafeAreaView>
    );
  }

  const routeTitle =
    job?.pickupAlias?.trim() && job?.dropoffAlias?.trim()
      ? `${job.pickupAlias} → ${job.dropoffAlias}`
      : `${job?.origin?.title || localized('Unknown origin')} → ${
          job?.destination?.title || localized('Unknown destination')
        }`;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localized('Job')}</Text>
          <Text style={styles.jobTitle}>{job?.name || '-'}</Text>
          <Text style={styles.jobSubtitle}>{routeTitle}</Text>

          <Text style={styles.summaryText}>
            {localized('Route')}: #{job?.routeIndex ?? '-'} · {localized('Trip')} #{job?.tripIndex ?? '-'}
          </Text>

          <Text style={styles.summaryText}>
            {localized('Price per Trip')}: {formatCurrency(job?.pricePerTrip ?? 0)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localized('Drivers')}</Text>
          {drivers.length > 0 ? (
            drivers.map((driver: any) => {
              const id = driver.userID || driver.id;
              return (
                <SelectCard
                  key={driver.id}
                  label={getPersonLabel(driver)}
                  value={getPersonMeta(driver)}
                  selected={driverID === id}
                  onPress={() => setDriverID(id)}
                />
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              {localized('No drivers assigned to this project')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localized('Trucks')}</Text>
          {trucks.length > 0 ? (
            trucks.map((truck: any) => (
              <SelectCard
                key={truck.id}
                label={getVehicleLabel(truck)}
                value={getVehicleMeta(truck)}
                selected={truckID === truck.id}
                onPress={() => setTruckID(truck.id)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              {localized('No trucks assigned to this project')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localized('Trailers')}</Text>
          {trailers.length > 0 ? (
            trailers.map((trailer: any) => (
              <SelectCard
                key={trailer.id}
                label={getVehicleLabel(trailer)}
                value={getVehicleMeta(trailer)}
                selected={trailerID === trailer.id}
                onPress={() => setTrailerID(trailer.id)}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>
              {localized('No trailers assigned to this project')}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{localized('Dispatchers')}</Text>
          {dispatchers.length > 0 ? (
            dispatchers.map((dispatcher: any) => {
              const id = dispatcher.userID || dispatcher.id;
              return (
                <SelectCard
                  key={dispatcher.id}
                  label={getPersonLabel(dispatcher)}
                  value={getPersonMeta(dispatcher)}
                  selected={dispatcherID === id}
                  onPress={() => setDispatcherID(id)}
                />
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              {localized('No dispatchers assigned to this project')}
            </Text>
          )}
        </View>

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>{localized('Current Selection')}</Text>

          <Text style={styles.summaryText}>
            {localized('Driver')}: {selectedDriver
              ? getPersonLabel(selectedDriver)
              : '-'}
          </Text>

          <Text style={styles.summaryText}>
            {localized('Truck')}: {selectedTruck
              ? getVehicleLabel(selectedTruck)
              : '-'}
          </Text>

          <Text style={styles.summaryText}>
            {localized('Trailer')}: {selectedTrailer
              ? getVehicleLabel(selectedTrailer)
              : '-'}
          </Text>

          <Text style={styles.summaryText}>
            {localized('Dispatcher')}: {selectedDispatcher
              ? getPersonLabel(selectedDispatcher)
              : '-'}
          </Text>
        </View>

        <Pressable
          style={[styles.confirmButton, saving ? styles.disabledButton : null]}
          onPress={handleAssign}
          disabled={saving}
        >
          <MaterialCommunityIcons name="check" size={18} color="#fff" />
          <Text style={styles.confirmButtonText}>
            {saving ? localized('Saving...') : localized('Confirm Assignment')}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AssignJobModalScreen;