import React, {
  useState,
  useLayoutEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  FlatList,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import StatusTabs from '../../../../core/components/StatusTabs';
import { dynamicStyles } from './styles';

import useDriverAssignedVehicles from '../../../hooks/useDriverAssignedVehicles';
import useDriverInspectionHistory from '../../../hooks/useDriverInspectionHistory';

import { formatDate, fromFirestoreTimestamp } from '../../../../utils/dateUtils';

type InspectionTabKey = 'approved' | 'review' | 'pending' | 'history';

const APPROVED_STATUSES = ['approved_for_operation'];
const REVIEW_STATUSES = [
  'driver_submitted',
  'under_review',
  'resolved',
  'blocked_for_operation',
];

const getReadableStatus = (
  status: string | null | undefined,
  localized: (key: string) => string,
) => {
  switch (status) {
    case 'driver_submitted':
      return localized('Submitted - waiting for review');
    case 'under_review':
      return localized('Under review');
    case 'resolved':
      return localized('Resolved');
    case 'approved_for_operation':
      return localized('Approved for operation');
    case 'blocked_for_operation':
      return localized('Blocked for operation');
    default:
      return localized('No inspection submitted');
  }
};

const safeFormatFirestoreDate = (
  value: any,
  localized: (key: string) => string,
) => {
  if (!value) {
    return localized('No date provided');
  }

  try {
    if (typeof value?.toDate === 'function') {
      return formatDate(value.toDate());
    }

    if (typeof value?.seconds === 'number') {
      return formatDate(new Date(value.seconds * 1000));
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return formatDate(parsed);
    }

    return localized('No date provided');
  } catch {
    return localized('No date provided');
  }
};

const normalizeVehicleCategory = (item: any) => {
  const type = String(item?.type || item?.vehicleType || '').toLowerCase();

  if (type === 'truck') return 'Truck';
  if (type === 'trailer') return 'Trailer';
  return 'Other';
};

const DriverInspectionsHomeScreen = () => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const navigation = useNavigation<any>();

  const currentUser = useCurrentUser();
  const currentUserID = currentUser?.id || currentUser?.userID || '';
  const activeJob = currentUser?.activeJob || null;
  const vendorID =
    currentUser?.activeVendorID || currentUser?.vendorID || null;

  const [activeTab, setActiveTab] = useState<InspectionTabKey>('pending');

  const {
    vehicles = [],
    loading: vehiclesLoading,
  } = useDriverAssignedVehicles({
    userID: currentUserID,
    activeJob,
    vendorID,
  });

  const {
    inspections: inspectionHistory = [],
    loading: historyLoading,
  } = useDriverInspectionHistory(currentUserID);

  const onBotItemPress = useCallback(() => {}, []);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Inspections'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.getParent()?.getParent()?.openDrawer?.()}
          style={{ marginLeft: 16 }}
        >
          <MaterialCommunityIcons
            name="menu"
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={onBotItemPress}
          style={{ marginRight: 16 }}
        >
          <MaterialCommunityIcons
            name="robot-outline"
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      ),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, appearance, localized, theme, onBotItemPress]);

  const inspectionTabs = useMemo(
    () => [
      {
        key: 'approved',
        label: localized('Approved'),
        icon: 'check-circle-outline',
        color: 'green',
      },
      {
        key: 'review',
        label: localized('Review'),
        icon: 'clipboard-text-search-outline',
        color: 'orange',
      },
      {
        key: 'pending',
        label: localized('Pending'),
        icon: 'alert-circle-outline',
        color: 'red',
      },
      {
        key: 'history',
        label: localized('History'),
        icon: 'history',
        color: 'purple',
      },
    ],
    [localized],
  );

  const normalizedVehicles = useMemo(() => {
    return (vehicles || []).map((item: any) => {
      const summary = item?.inspectionSummary || null;
      const statusReport = summary?.statusReport || null;

      return {
        ...item,
        summary,
        statusReport,
        inspectionID: summary?.inspectionID || null,
        pdfURL: summary?.pdfURL || null,
        lastReportDate: summary?.lastReportDate || null,
        category: normalizeVehicleCategory(item),
      };
    });
  }, [vehicles]);

  const approvedVehicles = useMemo(
    () =>
      normalizedVehicles.filter(
        (item: any) =>
          APPROVED_STATUSES.includes(item.statusReport) && item?.isValid,
      ),
    [normalizedVehicles],
  );

  const reviewVehicles = useMemo(
    () =>
      normalizedVehicles.filter((item: any) =>
        REVIEW_STATUSES.includes(item.statusReport),
      ),
    [normalizedVehicles],
  );

  const pendingVehicles = useMemo(
    () =>
      normalizedVehicles.filter(
        (item: any) =>
          !item?.isValid ||
          !item.statusReport ||
          (!APPROVED_STATUSES.includes(item.statusReport) &&
            !REVIEW_STATUSES.includes(item.statusReport)),
      ),
    [normalizedVehicles],
  );

  const counters = useMemo(
    () => ({
      approved: approvedVehicles.length,
      review: reviewVehicles.length,
      pending: pendingVehicles.length,
      history: inspectionHistory.length,
    }),
    [approvedVehicles.length, reviewVehicles.length, pendingVehicles.length, inspectionHistory.length],
  );

  const filteredVehicles = useMemo(() => {
    if (activeTab === 'approved') return approvedVehicles;
    if (activeTab === 'review') return reviewVehicles;
    if (activeTab === 'pending') return pendingVehicles;
    return [];
  }, [activeTab, approvedVehicles, reviewVehicles, pendingVehicles]);

  const pendingSections = useMemo(() => {
    if (activeTab !== 'pending') return [];

    const grouped = filteredVehicles.reduce(
      (acc: Record<string, any[]>, item: any) => {
        const category = item?.category || 'Other';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(item);
        return acc;
      },
      {},
    );

    return Object.entries(grouped)
      .map(([title, data]) => ({
        title,
        data,
      }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [activeTab, filteredVehicles]);

  const flatPendingData = useMemo(() => {
    if (activeTab !== 'pending') return [];

    const rows: Array<
      | { kind: 'header'; id: string; title: string }
      | { kind: 'item'; id: string; item: any }
    > = [];

    pendingSections.forEach(section => {
      rows.push({
        kind: 'header',
        id: `header-${section.title}`,
        title: section.title,
      });

      section.data.forEach((item: any) => {
        rows.push({
          kind: 'item',
          id: `item-${item.id}`,
          item,
        });
      });
    });

    return rows;
  }, [activeTab, pendingSections]);

  const handleOpenInspection = (item: any) => {
    navigation.navigate('InspectionScreen', {
      vehicleType: item?.type || item?.vehicleType || 'Truck',
      vehicleID: item?.vehicleID || item?.id,
      source: 'driver_inspections',
      jobID: activeJob?.jobID || null,
      channelID: activeJob?.channelID || null,
      projectID: activeJob?.projectID || null,
    });
  };

  const handleOpenPdf = (item: any) => {
    navigation.navigate('ReportView', {
      pdfURL: item?.pdfURL,
      inspectionID: item?.inspectionID,
      vehicleID: item?.vehicleID || item?.id,
      vehicleType: item?.type || item?.vehicleType,
      statusReport: item?.statusReport,
    });
  };

  const handleOpenHistoryReport = (item: any) => {
    navigation.navigate('ReportView', {
      pdfURL: item?.pdfURL,
      inspectionID: item?.inspectionID || item?.id,
      vehicleID: item?.vehicleID || item?.truckID || item?.trailerID,
      vehicleType: item?.vehicleType,
      statusReport: item?.statusReport,
    });
  };

  const renderInspectionItem = ({ item }: { item: any }) => {
    const vehicleType =
      item?.type || item?.vehicleType || localized('Vehicle');

    const vehicleLabel =
      item?.number ||
      item?.name ||
      item?.vehicleID ||
      item?.id ||
      localized('Unnamed vehicle');

    const statusText = item?.isValid
      ? localized('Approved for operation')
      : item?.validationReason || getReadableStatus(item?.statusReport, localized);

    const hasPdf = !!item?.pdfURL;
    const canReview =
      item?.statusReport === 'driver_submitted' ||
      item?.statusReport === 'under_review' ||
      item?.statusReport === 'resolved' ||
      item?.statusReport === 'blocked_for_operation';

    const shouldInspect =
      !item?.isValid ||
      !item?.statusReport ||
      item?.statusReport === 'approved_for_operation';

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <Text style={styles.titleText}>
            {vehicleType} {vehicleLabel}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Inspection Status')}: {statusText}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Last Inspection')}:{' '}
            {safeFormatFirestoreDate(item?.lastReportDate, localized)}
          </Text>

          {item?.inspectionID ? (
            <Text style={styles.subtitleText}>
              {localized('Inspection ID')}: {item.inspectionID}
            </Text>
          ) : null}
        </View>

        <View style={styles.iconContainer}>
          {hasPdf ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleOpenPdf(item)}
            >
              <MaterialCommunityIcons
                name="eye-check"
                color="purple"
                size={32}
              />
              <Text style={styles.boldText}>{localized('View')}</Text>
            </TouchableOpacity>
          ) : null}

          {canReview ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleOpenPdf(item)}
            >
              <MaterialCommunityIcons
                name="clipboard-text-search-outline"
                color="orange"
                size={32}
              />
              <Text style={styles.boldText}>{localized('Review')}</Text>
            </TouchableOpacity>
          ) : null}

          {shouldInspect ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleOpenInspection(item)}
            >
              <MaterialCommunityIcons
                name="clipboard-edit-outline"
                color="orange"
                size={32}
              />
              <Text style={styles.boldText}>{localized('Inspect')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderHistoryItem = ({ item }: { item: any }) => {
    const vehicleLabel =
      item?.vehicleLabel ||
      item?.vehicleID ||
      item?.truckID ||
      item?.trailerID ||
      localized('Vehicle');

    const statusText = getReadableStatus(item?.statusReport, localized);

    return (
      <View style={styles.itemContainer}>
        <View style={styles.itemDetails}>
          <Text style={styles.titleText}>
            {item?.vehicleType || localized('Vehicle')} {vehicleLabel}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Status')}: {statusText}
          </Text>

          <Text style={styles.subtitleText}>
            {localized('Inspection Date')}:{' '}
            {safeFormatFirestoreDate(
              item?.lastReportDate || item?.createdAt,
              localized,
            )}
          </Text>

          {item?.inspectionID ? (
            <Text style={styles.subtitleText}>
              {localized('Inspection ID')}: {item.inspectionID}
            </Text>
          ) : null}
        </View>

        <View style={styles.iconContainer}>
          {!!item?.pdfURL ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleOpenHistoryReport(item)}
            >
              <MaterialCommunityIcons
                name="eye-check"
                color="purple"
                size={32}
              />
              <Text style={styles.boldText}>{localized('View')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderPendingRow = ({
    item,
  }: {
    item:
      | { kind: 'header'; id: string; title: string }
      | { kind: 'item'; id: string; item: any };
  }) => {
    if (item.kind === 'header') {
      return (
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeaderText}>
            {localized(item.title)}
          </Text>
        </View>
      );
    }

    return renderInspectionItem({ item: item.item });
  };

  const loading = vehiclesLoading || historyLoading;

  if (!currentUser) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          style={{ marginTop: 24 }}
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusTabs
        tabs={inspectionTabs}
        activeTab={activeTab}
        setActiveTab={(tab: string) => setActiveTab(tab as InspectionTabKey)}
        counters={counters}
      />

      {loading ? (
        <ActivityIndicator
          style={{ marginTop: 24 }}
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      ) : activeTab === 'history' ? (
        <FlatList
          data={inspectionHistory}
          keyExtractor={(item: any) => item.id}
          renderItem={renderHistoryItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {localized('No inspection history found')}
            </Text>
          }
        />
      ) : activeTab === 'pending' ? (
        <FlatList
          data={flatPendingData}
          keyExtractor={item => item.id}
          renderItem={renderPendingRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {localized('No vehicles found')}
            </Text>
          }
        />
      ) : (
        <FlatList
          data={filteredVehicles}
          keyExtractor={item => item.id}
          renderItem={renderInspectionItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {localized('No vehicles found')}
            </Text>
          }
        />
      )}
    </View>
  );
};

export default DriverInspectionsHomeScreen;