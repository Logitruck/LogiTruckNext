import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
import { formatDate, serializeDate } from '../../../../utils/dateUtils';

import useInspectionTemplate, {
  InspectionTemplateItem,
} from '../../../../modules/inspections/hooks/useInspectionTemplate';
import useDriverAssignedVehicles from '../../../hooks/useDriverAssignedVehicles';

type ResourceItem = {
  id: string;
  vehicleID?: string;
  number?: string;
  name?: string;
  licensePlate?: string;
  type?: 'Truck' | 'Trailer';
  vendor?: any;
  vendorDispatch?: any;
  dispatch?: any;
  dispatchCarrier?: any;
  inspectionSummary?: any;
  checks?: number;
  faults?: number;
  [key: string]: any;
};

type ChecklistItemState = {
  isChecked: boolean;
  label: string;
  fault: string;
  vehicleType: 'Truck' | 'Trailer';
};

type VehicleChecklistState = {
  vehicleID: string;
  number: string;
  name?: string;
  type: 'Truck' | 'Trailer';
  checklistItems: Record<string, ChecklistItemState>;
};

type GroupedTemplateItems = {
  truck: InspectionTemplateItem[];
  trailer: InspectionTemplateItem[];
};

type InspectionContextMode = 'job' | 'standalone';
type InspectionType = 'pretrip' | 'posttrip';

const EMPTY_GROUPED_ITEMS: GroupedTemplateItems = {
  truck: [],
  trailer: [],
};

const buildInspectionID = (vehicleID: string) =>
  `${vehicleID}_${new Date().getTime()}`;

const buildReportID = (vehicleID: string) => vehicleID;

const sortItems = (items: InspectionTemplateItem[]) =>
  [...items].sort((a, b) => {
    const orderA =
      typeof a.combinedOrder === 'number'
        ? a.combinedOrder
        : Number(a.order || 0);
    const orderB =
      typeof b.combinedOrder === 'number'
        ? b.combinedOrder
        : Number(b.order || 0);

    return orderA - orderB;
  });

const groupCombinedItems = (
  items: InspectionTemplateItem[],
): GroupedTemplateItems => {
  return items.reduce<GroupedTemplateItems>(
    (acc, item) => {
      if (item.vehicleType === 'Trailer') {
        acc.trailer.push(item);
      } else {
        acc.truck.push(item);
      }
      return acc;
    },
    { truck: [], trailer: [] },
  );
};

const InspectionScreen = ({ navigation, route }: any) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const currentUser = useCurrentUser();

  const currentUserID = currentUser?.id || currentUser?.userID || '';
  const activeJob = currentUser?.activeJob || null;
  const vendorID =
    currentUser?.activeVendorID || currentUser?.vendorID || null;

  const selectedVehicleTypeFromParams = route?.params?.vehicleType || null;
  const selectedVehicleIDFromParams = route?.params?.vehicleID || null;

  const inspectionType: InspectionType =
    route?.params?.inspectionType || 'pretrip';

  const inspectionContext: InspectionContextMode =
    route?.params?.inspectionContext || 'standalone';

  const routeJobID = route?.params?.jobID || null;
  const routeChannelID = route?.params?.channelID || null;
  const routeProjectID = route?.params?.projectID || null;

  const inspectionJobContext =
    inspectionContext === 'job'
      ? {
          jobID: routeJobID || activeJob?.jobID || null,
          channelID: routeChannelID || activeJob?.channelID || null,
          projectID: routeProjectID || activeJob?.projectID || null,
        }
      : {
          jobID: null,
          channelID: null,
          projectID: null,
        };

  const {
    vehicles,
    loading: vehiclesLoading,
  } = useDriverAssignedVehicles({
    userID: currentUserID,
    activeJob,
    vendorID,
  });

  const {
    items: truckTemplateItems,
    settings: inspectionSettings,
    loading: truckTemplateLoading,
  } = useInspectionTemplate({
    vendorID,
    vehicleType: 'Truck',
  });

  const {
    items: trailerTemplateItems,
    loading: trailerTemplateLoading,
  } = useInspectionTemplate({
    vendorID,
    vehicleType: 'Trailer',
  });

  const {
    items: combinedTemplateItems,
    loading: combinedTemplateLoading,
  } = useInspectionTemplate({
    vendorID,
    vehicleType: 'Truck',
  });

  const inspectionMode = inspectionSettings?.inspectionMode || 'separate';
  const isCombinedMode = inspectionMode === 'combined';

  const [activeTab, setActiveTab] = useState<'Truck' | 'Trailer'>('Truck');
  const [currentItem, setCurrentItem] = useState<ResourceItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [problemDescription, setProblemDescription] = useState('');
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);

  const [trucksList, setTrucksList] = useState<ResourceItem[]>([]);
  const [trailersList, setTrailersList] = useState<ResourceItem[]>([]);
  const [switchState, setSwitchState] = useState<
    Record<string, VehicleChecklistState>
  >({});
  const [faultDescriptions, setFaultDescriptions] = useState<
    Record<string, string>
  >({});
  const [odometerReading, setOdometerReading] = useState('');

  const currentDate = new Date();
  const currentTime = new Date().toLocaleTimeString();

  const headerTitle =
    inspectionType === 'posttrip'
      ? localized('Post Inspection')
      : localized('Pre Inspection');

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      title: headerTitle,
      headerShown: true,
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 16 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', marginRight: 12 }}>
          <TouchableOpacity
            style={{ paddingHorizontal: 8 }}
            onPress={() => navigation.navigate('PersonalChat')}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={22}
              color={colors.primaryText}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{ paddingHorizontal: 8 }}
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
    });
  }, [navigation, headerTitle, theme, appearance]);

  const normalizedVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return [];

    return vehicles.map((item: ResourceItem) => ({
      ...item,
      checks: 0,
      faults: 0,
      dispatchCarrier: item.vendorDispatch || item.dispatch || null,
    }));
  }, [vehicles]);

  const groupedCombinedItems = useMemo(() => {
    if (!combinedTemplateItems?.length) {
      return EMPTY_GROUPED_ITEMS;
    }

    return groupCombinedItems(sortItems(combinedTemplateItems));
  }, [combinedTemplateItems]);

  const availableTrucks = useMemo(
    () => normalizedVehicles.filter(vehicle => vehicle.type === 'Truck'),
    [normalizedVehicles],
  );

  const availableTrailers = useMemo(
    () => normalizedVehicles.filter(vehicle => vehicle.type === 'Trailer'),
    [normalizedVehicles],
  );

  const hasTruck = availableTrucks.length > 0;
  const hasTrailer = availableTrailers.length > 0;

  const shouldShowTabs = !isCombinedMode && hasTruck && hasTrailer;

  const templatesReady = isCombinedMode
    ? !truckTemplateLoading &&
      !trailerTemplateLoading &&
      !combinedTemplateLoading
    : !truckTemplateLoading && !trailerTemplateLoading;

  const getChecklistSourceForVehicle = (
    vehicleType: 'Truck' | 'Trailer',
  ) => {
    if (isCombinedMode) {
      return vehicleType === 'Truck'
        ? groupedCombinedItems.truck
        : groupedCombinedItems.trailer;
    }

    return vehicleType === 'Truck'
      ? sortItems(truckTemplateItems)
      : sortItems(trailerTemplateItems);
  };

  const createInitialState = (vehicleData: ResourceItem[]) => {
    const initialState: Record<string, VehicleChecklistState> = {};

    vehicleData.forEach(vehicle => {
      const vehicleKey = vehicle.id;
      const checklistSource = getChecklistSourceForVehicle(
        (vehicle.type || 'Truck') as 'Truck' | 'Trailer',
      );

      initialState[vehicleKey] = {
        vehicleID: vehicle.id,
        number: vehicle.number || '',
        name: vehicle.name || '',
        type: (vehicle.type || 'Truck') as 'Truck' | 'Trailer',
        checklistItems: {},
      };

      checklistSource.forEach(item => {
        initialState[vehicleKey].checklistItems[item.id] = {
          isChecked: false,
          label: item.label,
          fault: '',
          vehicleType:
            (item.vehicleType as 'Truck' | 'Trailer') ||
            ((vehicle.type || 'Truck') as 'Truck' | 'Trailer'),
        };
      });
    });

    return initialState;
  };

  const preferredVehicle = useMemo(() => {
    return (
      normalizedVehicles.find(vehicle => vehicle.id === selectedVehicleIDFromParams) ||
      normalizedVehicles.find(
        vehicle => vehicle.type === selectedVehicleTypeFromParams,
      ) ||
      availableTrucks[0] ||
      availableTrailers[0] ||
      null
    );
  }, [
    normalizedVehicles,
    availableTrucks,
    availableTrailers,
    selectedVehicleIDFromParams,
    selectedVehicleTypeFromParams,
  ]);

  useEffect(() => {
    if (!templatesReady) return;

    setTrucksList(availableTrucks);
    setTrailersList(availableTrailers);

    const initialState = createInitialState([
      ...availableTrucks,
      ...availableTrailers,
    ]);

    setSwitchState(initialState);

    if (preferredVehicle) {
      setCurrentItem(preferredVehicle);
      setActiveTab((preferredVehicle.type || 'Truck') as 'Truck' | 'Trailer');
    }
  }, [
    templatesReady,
    availableTrucks,
    availableTrailers,
    preferredVehicle,
    isCombinedMode,
    truckTemplateItems,
    trailerTemplateItems,
    combinedTemplateItems,
  ]);

  useEffect(() => {
    if (!shouldShowTabs) return;

    const nextCurrent =
      activeTab === 'Truck'
        ? availableTrucks[0] || availableTrailers[0] || null
        : availableTrailers[0] || availableTrucks[0] || null;

    if (nextCurrent) {
      setCurrentItem(nextCurrent);
    }
  }, [activeTab, shouldShowTabs, availableTrucks, availableTrailers]);

  const handleInputChange = (text: string) => {
    setOdometerReading(text);
  };

  const handleClearFaultDescription = (faultKey: string) => {
    setFaultDescriptions(prevDescriptions => {
      const newDescriptions = { ...prevDescriptions };
      delete newDescriptions[faultKey];
      return newDescriptions;
    });
  };

  const updateCheckCounter = (
    vehicleId: string,
    vehicleState: VehicleChecklistState,
  ) => {
    const totalChecks = Object.values(vehicleState.checklistItems).filter(
      item => item.isChecked,
    ).length;

    if (vehicleState.type === 'Truck') {
      setTrucksList(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, checks: totalChecks }
            : vehicle,
        ),
      );
    } else {
      setTrailersList(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, checks: totalChecks }
            : vehicle,
        ),
      );
    }
  };

  const updateFaultCounter = (
    vehicleId: string,
    vehicleState: VehicleChecklistState,
  ) => {
    const totalFaults = Object.values(vehicleState.checklistItems).filter(
      item => !!item.fault,
    ).length;

    if (vehicleState.type === 'Truck') {
      setTrucksList(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, faults: totalFaults }
            : vehicle,
        ),
      );
    } else {
      setTrailersList(prevVehicles =>
        prevVehicles.map(vehicle =>
          vehicle.id === vehicleId
            ? { ...vehicle, faults: totalFaults }
            : vehicle,
        ),
      );
    }
  };

  const calculateProgress = (vehicleId: string) => {
    const vehicle = switchState[vehicleId];
    if (!vehicle) return '0';

    const checklistItems = vehicle.checklistItems;
    const totalItems = Object.keys(checklistItems).length;

    if (!totalItems) return '0';

    const completedItems = Object.values(checklistItems).reduce(
      (acc, item) => acc + (item.isChecked || item.fault ? 1 : 0),
      0,
    );

    const progressPercent = (completedItems / totalItems) * 100;
    return progressPercent.toFixed(0);
  };

  const toggleSwitch = (vehicleId: string, itemId: string) => {
    setSwitchState(prevState => {
      const vehicle = prevState[vehicleId];
      if (!vehicle || !vehicle.checklistItems[itemId]) {
        return prevState;
      }

      const currentChecklistItem = vehicle.checklistItems[itemId];
      const isChecked = !currentChecklistItem.isChecked;

      const newState = {
        ...prevState,
        [vehicleId]: {
          ...vehicle,
          checklistItems: {
            ...vehicle.checklistItems,
            [itemId]: {
              ...currentChecklistItem,
              isChecked,
              fault: isChecked ? '' : currentChecklistItem.fault,
            },
          },
        },
      };

      if (isChecked) {
        handleClearFaultDescription(`${vehicleId}-${itemId}`);
      }

      updateCheckCounter(vehicleId, newState[vehicleId]);
      updateFaultCounter(vehicleId, newState[vehicleId]);

      return newState;
    });
  };

  const handleReportFault = (vehicleId: string, itemId: string) => {
    const faultKey = `${vehicleId}-${itemId}`;
    setProblemDescription(faultDescriptions[faultKey] || '');
    setCurrentItemId(faultKey);
    setModalVisible(true);
  };

  const confirmFaultReport = () => {
    if (!problemDescription.trim()) {
      Alert.alert(localized('Error'), localized('Please fill problem'));
      return;
    }

    if (!currentItemId) return;

    const [vehicleId, itemId] = currentItemId.split('-');

    setSwitchState(prevState => {
      const vehicle = prevState[vehicleId];
      if (!vehicle || !vehicle.checklistItems[itemId]) {
        return prevState;
      }

      const updatedState = {
        ...prevState,
        [vehicleId]: {
          ...vehicle,
          checklistItems: {
            ...vehicle.checklistItems,
            [itemId]: {
              ...vehicle.checklistItems[itemId],
              fault: problemDescription,
              isChecked: false,
            },
          },
        },
      };

      updateCheckCounter(vehicleId, updatedState[vehicleId]);
      updateFaultCounter(vehicleId, updatedState[vehicleId]);

      return updatedState;
    });

    setFaultDescriptions(prev => ({
      ...prev,
      [currentItemId]: problemDescription,
    }));

    setProblemDescription('');
    setModalVisible(false);
  };

  const getNonValidatedItems = (
    checklist: Record<string, VehicleChecklistState>,
  ) => {
    const nonValidatedItems: string[] = [];

    Object.values(checklist).forEach(vehicle => {
      Object.values(vehicle.checklistItems).forEach(item => {
        if (!item.isChecked && !item.fault) {
          nonValidatedItems.push(
            `${item.label} (${vehicle.name || vehicle.number || vehicle.vehicleID})`,
          );
        }
      });
    });

    return nonValidatedItems;
  };

  const buildSingleVehicleReport = (vehicleData: VehicleChecklistState) => {
    const vehicleRef = normalizedVehicles.find(
      vehicle => vehicle.id === vehicleData.vehicleID,
    );

    if (!vehicleRef) {
      return null;
    }

    const inspectionID = buildInspectionID(vehicleData.vehicleID);
    const reportID = buildReportID(vehicleData.vehicleID);

    return {
      reportID,
      inspectionID,
      vendorID,
      vehicleID: vehicleData.vehicleID,
      vehicleType: vehicleData.type,

      inspectionType,
      inspectionContext,

      driver: currentUser,
      dispatchCarrier: vehicleRef?.dispatchCarrier || null,
      carrier: vehicleRef?.vendor || null,

      channelID: inspectionJobContext.channelID,
      projectID: inspectionJobContext.projectID,
      jobID: inspectionJobContext.jobID,

      operationContext: {
        inspectionType,
        inspectionContext,
      },

      driverReport: {
        checklist: vehicleData.checklistItems,
        miles: vehicleData.type === 'Truck' ? odometerReading : '',
        dateReport: serializeDate(currentDate),
        timeReport: currentTime,
        signature: '',
        signatureURL: '',
        signedAt: null,
        signedBy: null,
      },

      reviewReport: {
        reviewedBy: null,
        reviewedAt: null,
        reviewSignature: '',
        reviewSignatureURL: '',
        resolutionNotes: '',
        correctedItems: [],
        finalDecision: null,
        canContinueOperation: null,
      },

      inspectionLocation: null,
      statusReport: 'driver_submitted',
    };
  };

  const handleGenerateReportPress = () => {
    const targetState = switchState;
    const nonValidatedItems = getNonValidatedItems(targetState);

    if (nonValidatedItems.length > 0) {
      Alert.alert(
        localized('Error'),
        `${localized('Review this items:')}\n${nonValidatedItems.join('\n')}`,
      );
      return;
    }

    const reports = Object.values(targetState)
      .filter(Boolean)
      .map(vehicleState => buildSingleVehicleReport(vehicleState))
      .filter(Boolean);

    if (!reports.length) {
      Alert.alert(
        localized('Error'),
        localized('No vehicles available to generate report'),
      );
      return;
    }

if (reports.length === 1) {
  navigation.navigate('PreviewInspection', {
    reportData: reports[0],
    role: 'driver',
    inspectionMode,
    returnTo: 'driver',
  });
  return;
}

navigation.navigate('PreviewInspection', {
  reports,
  role: 'driver',
  inspectionMode,
  returnTo: 'driver',
});
  };

  const VehicleIcon = ({
    type,
    color,
  }: {
    type?: 'Truck' | 'Trailer';
    color: string;
  }) => {
    const iconName =
      type === 'Truck' ? 'truck-cargo-container' : 'truck-trailer';

    return (
      <MaterialCommunityIcons
        name={iconName}
        color={color}
        size={20}
      />
    );
  };

  const renderChecklistForVehicle = (vehicle: ResourceItem | null) => {
    if (!vehicle) {
      return null;
    }

    const checklistItems = getChecklistSourceForVehicle(
      (vehicle.type || 'Truck') as 'Truck' | 'Trailer',
    );

    const currentVehicleState = switchState[vehicle.id];

    return (
      <FlatList
        data={checklistItems}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.checklistListContent}
        renderItem={({ item }) => (
          <View style={styles.checklistItem}>
            <TouchableOpacity
              style={styles.labelTouchable}
              onPress={() => toggleSwitch(vehicle.id, item.id)}
            >
              <Text style={styles.label}>{item.label}</Text>
            </TouchableOpacity>

            <View style={styles.controlsContainer}>
              <Switch
                onValueChange={() => toggleSwitch(vehicle.id, item.id)}
                value={
                  currentVehicleState?.checklistItems?.[item.id]?.isChecked ||
                  false
                }
                style={[
                  styles.switchStyle,
                  Platform.OS === 'android' && {
                    transform: [{ scaleX: 1 }, { scaleY: 1 }],
                  },
                ]}
              />

              <MaterialCommunityIcons
                name="alert-circle"
                size={18}
                color={
                  currentVehicleState?.checklistItems?.[item.id]?.fault
                    ? 'red'
                    : 'gray'
                }
                onPress={() => handleReportFault(vehicle.id, item.id)}
              />
            </View>
          </View>
        )}
      />
    );
  };

  const renderTabs = () => {
    if (!shouldShowTabs) {
      return null;
    }

    return (
      <View style={styles.topTabsContainer}>
        <TouchableOpacity
          style={[
            styles.topTabButton,
            activeTab === 'Truck' && styles.topTabButtonActive,
          ]}
          onPress={() => setActiveTab('Truck')}
        >
          <Text
            style={[
              styles.topTabText,
              activeTab === 'Truck' && styles.topTabTextActive,
            ]}
          >
            {localized('Truck')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topTabButton,
            activeTab === 'Trailer' && styles.topTabButtonActive,
          ]}
          onPress={() => setActiveTab('Trailer')}
        >
          <Text
            style={[
              styles.topTabText,
              activeTab === 'Trailer' && styles.topTabTextActive,
            ]}
          >
            {localized('Trailer')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const selectorData = useMemo(() => {
    if (shouldShowTabs) {
      return activeTab === 'Truck' ? trucksList : trailersList;
    }

    return trucksList.concat(trailersList);
  }, [shouldShowTabs, activeTab, trucksList, trailersList]);

  if (vehiclesLoading || !templatesReady) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
        <Text style={styles.emptyText}>
          {localized('Loading inspection...')}
        </Text>
      </View>
    );
  }

  if (!normalizedVehicles.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>
          {localized('No Vehicles Assigned')}
        </Text>
        <Text style={styles.emptyText}>
          {localized(
            'You do not have assigned vehicles available for inspection.',
          )}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.compactHeaderArea}>
        <View style={styles.summaryBar}>
          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>{localized('Carrier')}</Text>
            <Text style={styles.summaryValue}>
              {normalizedVehicles[0]?.vendor?.title || '—'}
            </Text>
          </View>

          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>{localized('Date')}</Text>
            <Text style={styles.summaryValue}>{formatDate(currentDate)}</Text>
          </View>

          <View style={styles.summaryChip}>
            <Text style={styles.summaryLabel}>{localized('Type')}</Text>
            <Text style={styles.summaryValue}>
              {localized(inspectionType === 'posttrip' ? 'Posttrip' : 'Pretrip')}
            </Text>
          </View>
        </View>

        <View style={styles.odometerRow}>
          <Text style={styles.odometerLabel}>{localized('Odometer')}</Text>
          <TextInput
            style={styles.odometerInput}
            placeholder={localized('Enter Odometer Reading')}
            value={odometerReading}
            onChangeText={handleInputChange}
            keyboardType="numeric"
          />
        </View>

        <FlatList
          horizontal
          data={selectorData}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.vehicleTabsList}
          renderItem={({ item }) => {
            const isActive = currentItem?.id === item.id;
            const progress = Number(calculateProgress(item.id));

            return (
              <TouchableOpacity
                style={[
                  styles.vehicleTabCard,
                  isActive && styles.vehicleTabCardActive,
                ]}
                onPress={() => {
                  setCurrentItem(item);
                  setActiveTab((item.type || 'Truck') as 'Truck' | 'Trailer');
                }}
              >
                <VehicleIcon
                  type={item.type}
                  color={
                    isActive
                      ? '#FFFFFF'
                      : theme.colors[appearance].primaryText
                  }
                />
                <View style={styles.vehicleTabInfo}>
                  <Text
                    style={[
                      styles.vehicleTabTitle,
                      isActive && styles.vehicleTabTitleActive,
                    ]}
                  >
                    {item.name || item.number || item.id}
                  </Text>
                  <Text
                    style={[
                      styles.vehicleTabMeta,
                      isActive && styles.vehicleTabMetaActive,
                    ]}
                  >
                    {progress}% • {localized('Faults')}: {item.faults || 0}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        {renderTabs()}
      </View>

      <View style={styles.checklistScrollArea}>
        {renderChecklistForVehicle(currentItem)}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text>{localized('Describe Problem')}</Text>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.input}
                onChangeText={setProblemDescription}
                value={problemDescription}
                multiline
                numberOfLines={4}
                placeholder={localized('Describe Problem here')}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonStyle}
                onPress={confirmFaultReport}
              >
                <Text style={styles.buttonText}>
                  {localized('Confirm')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>
                  {localized('Return')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.reportButtonContainer}>
        <TouchableOpacity
          style={styles.buttonStyle}
          onPress={handleGenerateReportPress}
        >
          <Text style={styles.backButtonText}>
            {localized('Go to Sign')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default InspectionScreen;