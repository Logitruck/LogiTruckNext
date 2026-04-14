import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
import useAssignedJobs from '../../../hooks/useAssignedJobs';
import useDriverAssignedVehicles from '../../../hooks/useDriverAssignedVehicles';
import dynamicStyles from './styles';
import {
  formatDate,
  fromFirestoreTimestamp,
} from '../../../../utils/dateUtils';
import {
  getPendingInspectionReports,
  PendingInspectionReport,
} from '../../../../modules/inspections/services/inspectionStorageService';
import { db } from '../../../../core/firebase/config';

type InspectionSummary = {
  inspectionID?: string;
  reportID?: string;
  pairedVehicleID?: string | null;
  statusReport?: string | null;
  lastReportDate?: any;
  pdfURL?: string | null;
  canContinueOperation?: boolean | null;
  lastDriverID?: string | null;
  reviewedAt?: any;
  vehicleType?: 'Truck' | 'Trailer';
  inspectionType?: 'pretrip' | 'posttrip' | null;
  inspectionContext?: 'job' | 'standalone' | null;
  inspectionLocation?: {
    latitude: number;
    longitude: number;
  } | null;
};

type DriverVehicle = {
  id: string;
  vehicleID?: string;
  type?: 'Truck' | 'Trailer';
  name?: string;
  number?: string;
  vendor?: any;
  dispatchCarrier?: any;
  inspectionSummary?: InspectionSummary | null;
  validationReason?: string;
  isValid?: boolean;
  requiresPretrip?: boolean;
  requiresPosttrip?: boolean;
  operationSessionOpen?: boolean;
  lastInspectionType?: 'pretrip' | 'posttrip' | null;
  lastInspectionContext?: 'job' | 'standalone' | null;
  lastInspectionLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  [key: string]: any;
};

type AssignedJob = {
  id: string;
  status?: string;
  tripStatus?: string;
  origin?: { title?: string };
  destination?: { title?: string };
  materialType?: string;
  cargo?: { description?: string };
  scheduledAt?: any;
  assignedTruckID?: string | null;
  assignedTrailerID?: string | null;
  channelID?: string | null;
  projectID?: string | null;
  canStartJob?: boolean;
  validationReason?: string;
  inspectionStatusLabel?: string;
  inspectionStatusColor?: 'green' | 'orange' | 'red' | 'gray';
  truckInspection?: {
    inspectionSummary?: InspectionSummary | null;
    statusReport?: string | null;
    lastInspectionDate?: any;
    lastInspectionPDF?: string | null;
    lastDriverID?: string | null;
    requiresPretrip?: boolean;
    operationSessionOpen?: boolean;
    lastInspectionType?: 'pretrip' | 'posttrip' | null;
    lastInspectionContext?: 'job' | 'standalone' | null;
  } | null;
  [key: string]: any;
};

const HomeDriverScreen = () => {
  const navigation = useNavigation<any>();
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const currentUser = useCurrentUser();
  const currentUserID = currentUser?.id || currentUser?.userID || '';
  const activeJob = currentUser?.activeJob || null;
  const vendorID =
    currentUser?.activeVendorID || currentUser?.vendorID || null;

  const { vehicles, loading: vehiclesLoading } = useDriverAssignedVehicles({
    userID: currentUserID,
    activeJob,
    vendorID,
  });

  const {
    assignedJobs = [],
    loading: jobsLoading,
  } = useAssignedJobs(currentUserID);

  const [pendingSyncReports, setPendingSyncReports] = useState<
    PendingInspectionReport[]
  >([]);
  const [startingJobID, setStartingJobID] = useState<string | null>(null);

  const activeTrip = assignedJobs.find(
    (job: AssignedJob) => job.status === 'in_progress',
  );

  const upcomingJobs = assignedJobs.filter(
    (job: AssignedJob) => job.status !== 'in_progress',
  );

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Home'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={styles.menuButton}
        >
          <MaterialCommunityIcons
            name="menu"
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('DriverChatStack')}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={22}
              color={colors.primaryText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={() => navigation.navigate('Support')}
          >
            <MaterialCommunityIcons
              name="help-circle-outline"
              size={22}
              color={colors.primaryText}
            />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [appearance, localized, navigation, styles, theme]);

  const loadPendingSyncReports = useCallback(async () => {
    try {
      const pendingReports = await getPendingInspectionReports();
      setPendingSyncReports(pendingReports);
    } catch (error) {
      console.error('❌ Error loading pending inspection reports:', error);
      setPendingSyncReports([]);
    }
  }, []);

  useEffect(() => {
    loadPendingSyncReports();
  }, [loadPendingSyncReports]);

  const normalizedVehicles = useMemo<DriverVehicle[]>(() => {
    if (!Array.isArray(vehicles)) {
      return [];
    }

    return vehicles.map((item: DriverVehicle) => ({
      ...item,
      vehicleID: item?.vehicleID || item?.id,
      inspectionSummary: item?.inspectionSummary || null,
    }));
  }, [vehicles]);

  const getVehicleOperationalMeta = (vehicle: DriverVehicle) => {
    const summary = vehicle?.inspectionSummary || null;

    if (vehicle?.requiresPosttrip) {
      return {
        color: 'purple',
        label: localized('Post-trip pending'),
        primaryAction: 'posttrip',
      };
    }

    if (vehicle?.isValid) {
      return {
        color: 'green',
        label: localized('Ready for operation'),
        primaryAction: 'view',
      };
    }

    if (vehicle?.requiresPretrip) {
      return {
        color: 'orange',
        label: localized('Pre-trip required'),
        primaryAction: 'pretrip',
      };
    }

    if (
      summary?.statusReport === 'driver_submitted' ||
      summary?.statusReport === 'under_review' ||
      summary?.statusReport === 'resolved' ||
      summary?.statusReport === 'blocked_for_operation'
    ) {
      return {
        color: summary?.statusReport === 'blocked_for_operation' ? 'red' : 'orange',
        label: localized(vehicle?.validationReason || 'Inspection under review'),
        primaryAction: 'review',
      };
    }

    return {
      color: 'gray',
      label: localized(vehicle?.validationReason || 'No inspection submitted'),
      primaryAction: 'pretrip',
    };
  };

 const handleStartStandaloneInspection = (
  vehicle: DriverVehicle,
  inspectionType: 'pretrip' | 'posttrip',
) => {
  navigation.navigate('DriverMainTabs', {
    screen: 'DriverInspectionsTab',
    params: {
      screen: 'InspectionScreen',
      params: {
        vehicleType: vehicle?.type || 'Truck',
        vehicleID: vehicle?.vehicleID || vehicle?.id,
        source: inspectionType === 'posttrip' ? 'post_inspection' : 'home',
        inspectionType,
        inspectionContext: 'standalone',
      },
    },
  });
};

  const handleViewReport = (vehicle: DriverVehicle) => {
    const summary = vehicle?.inspectionSummary;

   navigation.navigate('DriverMainTabs', {
  screen: 'DriverInspectionsTab',
  params: {
    screen: 'ReportView',
    params: {
      vehicleType: vehicle?.type,
      pdfURL: summary?.pdfURL,
      inspectionID: summary?.inspectionID,
      statusReport: summary?.statusReport,
    },
  },
});
  };

  const handleVehiclePrimaryAction = (vehicle: DriverVehicle) => {
    const meta = getVehicleOperationalMeta(vehicle);

    if (meta.primaryAction === 'view') {
      handleViewReport(vehicle);
      return;
    }

    if (meta.primaryAction === 'review') {
      handleViewReport(vehicle);
      return;
    }

    if (meta.primaryAction === 'posttrip') {
      handleStartStandaloneInspection(vehicle, 'posttrip');
      return;
    }

    handleStartStandaloneInspection(vehicle, 'pretrip');
  };

  const handleStartJob = async (job: AssignedJob) => {
    try {
      if (!job?.channelID || !job?.projectID || !job?.id || !currentUserID) {
        Alert.alert(
          localized('Error'),
          localized('Missing required job information.'),
        );
        return;
      }

      if (!job?.canStartJob) {
        Alert.alert(
          localized('Inspection required'),
          localized(job?.validationReason || 'Inspection required'),
        );
        return;
      }

      setStartingJobID(job.id);

      const jobRef = doc(
        db,
        'project_channels',
        job.channelID,
        'projects',
        job.projectID,
        'jobs',
        job.id,
      );

      const jobSnap = await getDoc(jobRef);

      if (!jobSnap.exists()) {
        throw new Error(localized('Job not found.'));
      }

      const jobData = jobSnap.data();
      const assignedTruckID = jobData?.assignedTruckID || null;
      const assignedTrailerID = jobData?.assignedTrailerID || null;
      const resolvedVendorID = jobData?.vendorID || vendorID || null;

      const userRef = doc(db, 'users', currentUserID);

      await updateDoc(jobRef, {
        status: 'in_progress',
        tripStatus: 'in_progress',
        startedAt: serverTimestamp(),
        tripStatusUpdatedAt: serverTimestamp(),
        startedByDriverID: currentUserID,
      });

      await updateDoc(userRef, {
        activeJob: {
          jobID: job.id,
          projectID: job.projectID,
          channelID: job.channelID,
        },
      });

      if (resolvedVendorID && assignedTruckID) {
        const truckRef = doc(
          db,
          'vendor_vehicles',
          resolvedVendorID,
          'vehicles',
          assignedTruckID,
        );

        await updateDoc(truckRef, {
          currentJobID: job.id,
          currentJobRef: {
            channelID: job.channelID,
            projectID: job.projectID,
            jobID: job.id,
          },
          currentDriverID: currentUserID,
          liveStatus: 'in_progress',
          updatedAt: serverTimestamp(),
        });
      }

      if (resolvedVendorID && assignedTrailerID) {
        const trailerRef = doc(
          db,
          'vendor_vehicles',
          resolvedVendorID,
          'vehicles',
          assignedTrailerID,
        );

        await updateDoc(trailerRef, {
          currentJobID: job.id,
          currentJobRef: {
            channelID: job.channelID,
            projectID: job.projectID,
            jobID: job.id,
          },
          currentDriverID: currentUserID,
          liveStatus: 'in_progress',
          updatedAt: serverTimestamp(),
        });
      }

      navigation.navigate('DriverActiveJobStack');
    } catch (error: any) {
      console.error('🔥 Error starting job:', error);
      Alert.alert(
        localized('Error'),
        error?.message || localized('Unable to start job.'),
      );
    } finally {
      setStartingJobID(null);
    }
  };

  const handleOpenFuelExpense = (vehicle: DriverVehicle) => {
  navigation.navigate('AddFuelExpense', {
    vehicleID: vehicle?.vehicleID || vehicle?.id,
    vehicleType: vehicle?.type || 'Truck',
    vendorID:
      vehicle?.vendor?.id ||
      currentUser?.activeVendorID ||
      currentUser?.vendorID ||
      vendorID ||
      null,
  });
};

  const renderPendingReportItem = ({
    item,
  }: {
    item: PendingInspectionReport;
  }) => {
    return (
      <View style={styles.pendingItem}>
        <View style={styles.pendingItemDetails}>
          <Text style={styles.pendingItemTitle}>
            {localized('Pending sync')} - {item.role}
          </Text>
          <Text style={styles.pendingItemSubtitle}>
            {localized('Inspection ID')}: {item.reportData?.inspectionID || '—'}
          </Text>
          <Text style={styles.pendingItemSubtitle}>
            {localized('Truck ID')}: {item.reportData?.truckID || '—'}
          </Text>
          <Text style={styles.pendingItemSubtitle}>
            {localized('Status')}: {item.reportData?.statusReport || '—'}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="cloud-upload-outline"
          size={28}
          color="orange"
        />
      </View>
    );
  };

  const PendingReportsSection = () => {
    if (!pendingSyncReports.length) {
      return null;
    }

    return (
      <View style={styles.pendingSection}>
        <Text style={styles.titleHeader}>
          {localized('Pending Reports')}: {pendingSyncReports.length}
        </Text>

        <FlatList
          data={pendingSyncReports}
          renderItem={renderPendingReportItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderVehicleItem = ({ item }: { item: DriverVehicle }) => {
    const summary = item?.inspectionSummary || null;
    const operationalMeta = getVehicleOperationalMeta(item);

    const vehicleName =
      item?.name || item?.number || item?.vehicleID || item?.id || "—";

    const lastInspectionDate = summary?.lastReportDate
      ? formatDate(
          fromFirestoreTimestamp(summary.lastReportDate) ||
            summary.lastReportDate,
        )
      : localized("Not available");

    const iconName =
      item?.type === "Truck" ? "truck-cargo-container" : "truck-trailer";

    const primaryActionLabel =
      operationalMeta.primaryAction === "view"
        ? localized("View")
        : operationalMeta.primaryAction === "review"
          ? localized("Review")
          : operationalMeta.primaryAction === "posttrip"
            ? localized("Post Inspection")
            : localized("Inspect");

    const primaryActionIcon =
      operationalMeta.primaryAction === "view"
        ? "eye-check"
        : operationalMeta.primaryAction === "review"
          ? "clipboard-text-search-outline"
          : operationalMeta.primaryAction === "posttrip"
            ? "clipboard-check-outline"
            : "clipboard-edit-outline";

    return (
      <View style={styles.card}>
        <View style={styles.itemContainer}>
          <MaterialCommunityIcons
            name={iconName}
            color={operationalMeta.color}
            size={38}
            style={styles.itemIcon}
          />

          <View style={styles.itemDetails}>
            <Text style={styles.titleText}>{vehicleName}</Text>

            <Text style={styles.subtitleText}>
              {localized("Carrier")}: {item?.vendor?.title || "—"}
            </Text>

            <Text style={styles.subtitleText}>
              {localized("Last Inspection")}: {lastInspectionDate}
            </Text>

            <Text style={styles.subtitleText}>
              {localized("Last Type")}:{" "}
              {localized(item?.lastInspectionType || "—")}
            </Text>

            <Text style={[styles.statusText, { color: operationalMeta.color }]}>
              {localized("Status")}: {operationalMeta.label}
            </Text>
          </View>

          <View style={styles.actionColumn}>
            <TouchableOpacity
              onPress={() => handleVehiclePrimaryAction(item)}
              style={styles.actionButton}
            >
              <MaterialCommunityIcons
                name={primaryActionIcon}
                color={operationalMeta.color}
                size={30}
              />
              <Text style={styles.actionLabel}>{primaryActionLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleOpenFuelExpense(item)}
              style={styles.actionButton}
            >
              <MaterialCommunityIcons
                name="gas-station-outline"
                color="#2563eb"
                size={28}
              />
              <Text style={styles.actionLabel}>{localized("Fuel")}</Text>
            </TouchableOpacity>

            {summary?.pdfURL ? (
              <TouchableOpacity
                onPress={() => handleViewReport(item)}
                style={styles.actionButton}
              >
                <MaterialCommunityIcons
                  name="file-document-outline"
                  color="gray"
                  size={28}
                />
                <Text style={styles.actionLabel}>{localized("PDF")}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  const AssignedJobItem = ({ item }: { item: AssignedJob }) => {
    const inspectionSnapshot = item?.truckInspection || null;
    const canStartJob = !!item?.canStartJob;
    const isStarting = startingJobID === item.id;

    const inspectionDate = inspectionSnapshot?.lastInspectionDate
      ? formatDate(
          fromFirestoreTimestamp(inspectionSnapshot.lastInspectionDate) ||
            inspectionSnapshot.lastInspectionDate,
        )
      : localized('Not available');

    const statusMeta = canStartJob
      ? {
          color: item?.inspectionStatusColor || 'green',
          label: localized(
            item?.inspectionStatusLabel || 'Ready to start',
          ),
        }
      : {
          color: item?.inspectionStatusColor || 'orange',
          label: localized(
            item?.inspectionStatusLabel || 'Inspection required',
          ),
        };

    return (
      <View style={[styles.jobCard, !canStartJob && styles.jobCardWarning]}>
        <View style={styles.jobInfo}>
          <Text style={styles.jobRoute}>
            {item?.origin?.title || "—"} → {item?.destination?.title || "—"}
          </Text>

          <Text style={styles.jobMeta}>
            {localized("Material")}:{" "}
            {item?.materialType || item?.cargo?.description || "N/A"}
          </Text>

          <Text style={styles.jobMeta}>
            {localized("Start Date")}:{" "}
            {item?.scheduledAt
              ? formatDate(
                  fromFirestoreTimestamp(item.scheduledAt) || item.scheduledAt,
                )
              : "N/A"}
          </Text>

          <Text style={[styles.jobMeta, { color: statusMeta.color }]}>
            {localized("Inspection Status")}: {statusMeta.label}
          </Text>

          <Text style={styles.jobMetaMuted}>
            {localized("Last Inspection")}: {inspectionDate}
          </Text>
        </View>

        <View style={styles.jobActions}>
          {canStartJob ? (
            <>
              <TouchableOpacity
                style={styles.jobActionButton}
                disabled={isStarting}
                onPress={() => handleStartJob(item)}
              >
                <MaterialCommunityIcons
                  name={isStarting ? "progress-clock" : "play-circle-outline"}
                  size={30}
                  color="green"
                />
                <Text style={styles.inspectLabel}>
                  {isStarting
                    ? localized("Starting...")
                    : localized("Start Job")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.jobActionButton}
                onPress={() =>
                  navigation.navigate("PersonalChat", { jobID: item.id })
                }
              >
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={30}
                  color="green"
                />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.jobActionButton}
              onPress={() =>
                navigation.navigate("DriverMainTabs", {
                  screen: "DriverInspectionsTab",
                  params: {
                    screen: "InspectionScreen",
                    params: {
                      vehicleType: "Truck",
                      vehicleID: item?.assignedTruckID,
                      source: "job",
                      inspectionType: "pretrip",
                      inspectionContext: "job",
                      jobID: item?.id,
                      channelID: item?.channelID,
                      projectID: item?.projectID,
                    },
                  },
                })
              }
            >
              <MaterialCommunityIcons
                name="clipboard-edit-outline"
                size={30}
                color="orange"
              />
              <Text style={styles.inspectLabel}>{localized("Inspect")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (vehiclesLoading || jobsLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
        <Text style={styles.emptyText}>{localized('Loading...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {activeTrip ? (
        <View style={styles.activeTripBanner}>
          <View style={styles.activeTripHeader}>
            <View style={styles.activeTripInfo}>
              <Text style={styles.activeTripTitle}>
                {localized('Active Job')}
              </Text>
              <Text style={styles.activeTripText}>
                {activeTrip?.origin?.title || '—'} →{' '}
                {activeTrip?.destination?.title || '—'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.returnButton}
              onPress={() => navigation.navigate('DriverActiveJobStack')}
            >
              <Text style={styles.returnButtonText}>
                {localized('Return to Active Job')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <FlatList
        data={normalizedVehicles}
        renderItem={renderVehicleItem}
        keyExtractor={item => String(item.vehicleID || item.id)}
        ListHeaderComponent={
          <Text style={styles.titleHeader}>
            {localized('Vehicle Inspections')}
          </Text>
        }
        ListFooterComponent={
          <>
            <PendingReportsSection />

            <FlatList
              data={upcomingJobs}
              renderItem={({ item }) => <AssignedJobItem item={item} />}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              ListHeaderComponent={
                <Text style={styles.titleHeader}>
                  {localized('Scheduled Jobs')}
                </Text>
              }
            />
          </>
        }
      />
    </View>
  );
};

export default HomeDriverScreen;