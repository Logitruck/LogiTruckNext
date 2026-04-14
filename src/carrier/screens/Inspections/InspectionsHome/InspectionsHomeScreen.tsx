import React, {
  useState,
  useLayoutEffect,
  useEffect,
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
import { useNavigation, useRoute } from '@react-navigation/native';

import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';
import StatusTabs from '../../../../core/components/StatusTabs';
import useCarrierInspectionVehicles from '../../../../modules/inspections/hooks/useCarrierInspectionVehicles';
import { formatDate } from '../../../../utils/dateUtils';

type InspectionTabKey = 'approved' | 'review' | 'pending';

type PendingFlatRow =
  | { kind: 'header'; id: string; title: string }
  | { kind: 'item'; id: string; item: any };

const APPROVED_STATUSES = ['approved_for_operation'];
const REVIEW_STATUSES = [
  'driver_submitted',
  'under_review',
  'resolved',
  'blocked_for_operation',
];

const getInitialTab = (status?: string): InspectionTabKey => {
  if (status === 'approved') return 'approved';
  if (status === 'review') return 'review';
  return 'pending';
};

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

const getDriverLabel = (item: any, localized: (key: string) => string) => {
  const firstName =
    item?.inspectionSummary?.driver?.firstName ||
    item?.driver?.firstName ||
    item?.assignedDriver?.firstName ||
    '';

  const lastName =
    item?.inspectionSummary?.driver?.lastName ||
    item?.driver?.lastName ||
    item?.assignedDriver?.lastName ||
    '';

  const fullName = `${firstName} ${lastName}`.trim();

  if (fullName) {
    return fullName;
  }

  return (
    item?.assignedDriverName ||
    item?.currentAssignedDriverName ||
    item?.inspectionSummary?.lastDriverName ||
    item?.currentAssignedDriverID ||
    item?.assignedDriverID ||
    localized('Not assigned')
  );
};

const normalizeVehicleCategory = (item: any) => {
  const type = String(item?.type || item?.vehicleType || '').toLowerCase();

  if (type === 'truck') return 'Truck';
  if (type === 'trailer') return 'Trailer';
  return 'Other';
};

const InspectionsHomeScreen = () => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const currentUser = useCurrentUser();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [activeTab, setActiveTab] = useState<InspectionTabKey>(
    getInitialTab(route?.params?.status),
  );

  const vendorID =
    currentUser?.activeVendorID || currentUser?.vendorID || null;

  const { vehicles, loading } = useCarrierInspectionVehicles(vendorID);

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
    ],
    [localized],
  );

  const onBotItemPress = useCallback(() => {}, []);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Inspections'),
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
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

  useEffect(() => {
    const nextTab = getInitialTab(route?.params?.status);
    setActiveTab(nextTab);
  }, [route?.params?.status]);

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
      normalizedVehicles.filter((item: any) =>
        APPROVED_STATUSES.includes(item.statusReport),
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
    }),
    [approvedVehicles.length, reviewVehicles.length, pendingVehicles.length],
  );

  const filteredVehicles = useMemo(() => {
    if (activeTab === 'approved') return approvedVehicles;
    if (activeTab === 'review') return reviewVehicles;
    return pendingVehicles;
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

  const flatPendingData = useMemo<PendingFlatRow[]>(() => {
    if (activeTab !== 'pending') return [];

    const rows: PendingFlatRow[] = [];

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
    navigation.navigate('InspectionRepair', {
      inspectionRef: {
        vendorID,
        inspectionID: item?.inspectionID,
        vehicleID: item?.vehicleID || item?.id,
        vehicleType: item?.type || item?.vehicleType,
      },
      vehicle: item,
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

  const renderInspectionItem = ({ item }: { item: any }) => {
    const vehicleType =
      item?.type || item?.vehicleType || localized('Vehicle');

    const vehicleLabel =
      item?.number ||
      item?.name ||
      item?.vehicleID ||
      item?.id ||
      localized('Unnamed vehicle');

    const statusText = getReadableStatus(item?.statusReport, localized);
    const assignedDriverLabel = getDriverLabel(item, localized);

    const hasPdf = !!item?.pdfURL;

    const canContinueReview =
      item?.statusReport === 'driver_submitted' ||
      item?.statusReport === 'under_review' ||
      item?.statusReport === 'resolved' ||
      item?.statusReport === 'blocked_for_operation';

    const isPendingWithoutCurrentInspection = !item?.statusReport;

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

          <Text style={styles.subtitleText}>
            {localized('Assigned Driver')}: {assignedDriverLabel}
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
              <Text style={styles.boldText}>
                {localized(
                  isPendingWithoutCurrentInspection
                    ? 'View Last Report'
                    : 'View',
                )}
              </Text>
            </TouchableOpacity>
          ) : null}

          {canContinueReview ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleOpenInspection(item)}
            >
              <MaterialCommunityIcons
                name="clipboard-text-search-outline"
                color="orange"
                size={32}
              />
              <Text style={styles.boldText}>{localized('Review')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  const renderPendingRow = ({
    item,
  }: {
    item: PendingFlatRow;
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

export default InspectionsHomeScreen;