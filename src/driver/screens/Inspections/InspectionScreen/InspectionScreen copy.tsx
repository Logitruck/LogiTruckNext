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

import useInspectionTemplate from '../../../../modules/inspections/hooks/useInspectionTemplate';
import useDriverAssignedVehicles from '../../../hooks/useDriverAssignedVehicles';

type ResourceItem = {
  id: string;
  number?: string;
  name?: string;
  licensePlate?: string;
  type?: 'Truck' | 'Trailer';
  vendor?: any;
  vendorDispatch?: any;
  dispatch?: any;
  checks?: number;
  faults?: number;
  [key: string]: any;
};

type ChecklistItemState = {
  isChecked: boolean;
  label: string;
  fault: string;
};

type VehicleChecklistState = {
  truckId: string;
  number: string;
  name?: string;
  type: 'Truck' | 'Trailer';
  checklistItems: Record<string, ChecklistItemState>;
};

const InspectionScreen = ({ navigation }: any) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const currentUser = useCurrentUser();

const currentUserID = currentUser?.id || currentUser?.userID || '';
const activeJob = currentUser?.activeJob || null;
const vendorID =
  currentUser?.activeVendorID ||
  currentUser?.vendorID ||
  null;

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
    loading: truckTemplateLoading,
  } = useInspectionTemplate('Truck');

  const {
    items: trailerTemplateItems,
    loading: trailerTemplateLoading,
  } = useInspectionTemplate('Trailer');

  const [isChecklistVisible, setIsChecklistVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<ResourceItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [problemDescription, setProblemDescription] = useState('');
  const [currentItemId, setCurrentItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const [trucksList, setTrucksList] = useState<ResourceItem[]>([]);
  const [trailersList, setTrailersList] = useState<ResourceItem[]>([]);
  const [switchState, setSwitchState] = useState<Record<string, VehicleChecklistState>>(
    {},
  );
  const [faultDescriptions, setFaultDescriptions] = useState<Record<string, string>>(
    {},
  );
  const [odometerReading, setOdometerReading] = useState('');

  const currentDate = new Date();
  const currentTime = new Date().toLocaleTimeString();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: localized('Inspect Vehicle'),
      headerShown: true,
    });
  }, [navigation, localized]);

  const normalizedVehicles = useMemo(() => {
    if (!Array.isArray(vehicles)) return [];

    return vehicles.map((item: ResourceItem) => ({
      ...item,
      checks: 0,
      faults: 0,
      dispatchCarrier: item.vendorDispatch || item.dispatch || null,
    }));
  }, [vehicles]);

  const templatesReady = !truckTemplateLoading && !trailerTemplateLoading;

  useEffect(() => {
    if (!templatesReady) return;

    const filteredTrucks = normalizedVehicles.filter(
      (vehicle) => vehicle.type === 'Truck',
    );
    const filteredTrailers = normalizedVehicles.filter(
      (vehicle) => vehicle.type === 'Trailer',
    );

    setTrucksList(filteredTrucks);
    setTrailersList(filteredTrailers);

    const initialState = createInitialState(
      [...filteredTrucks, ...filteredTrailers],
      truckTemplateItems,
      trailerTemplateItems,
    );

    setSwitchState(initialState);
  }, [
    normalizedVehicles,
    templatesReady,
    truckTemplateItems,
    trailerTemplateItems,
  ]);

  useEffect(() => {
    if (!currentItemId) return;

    const [vehicleId] = currentItemId.split('-');
    const vehicleState = switchState[vehicleId];

    if (vehicleState) {
      updateCheckCounter(vehicleId, vehicleState);
      updateFaultCounter(vehicleId, vehicleState);
    }
  }, [switchState, currentItemId]);

  const createInitialState = (
    vehicleData: ResourceItem[],
    truckItems: any[],
    trailerItems: any[],
  ) => {
    const initialState: Record<string, VehicleChecklistState> = {};

    vehicleData.forEach((vehicle) => {
      const vehicleKey = vehicle.id;
      const checklistSource =
        vehicle.type === 'Truck' ? truckItems : trailerItems;

      initialState[vehicleKey] = {
        truckId: vehicle.id,
        number: vehicle.number || '',
        name: vehicle.name || '',
        type: (vehicle.type || 'Truck') as 'Truck' | 'Trailer',
        checklistItems: {},
      };

      checklistSource.forEach((item: any) => {
        initialState[vehicleKey].checklistItems[item.id] = {
          isChecked: false,
          label: item.label,
          fault: '',
        };
      });
    });

    return initialState;
  };

  const handleInputChange = (text: string) => {
    setOdometerReading(text);
  };

  const handleClearFaultDescription = (faultKey: string) => {
    setFaultDescriptions((prevDescriptions) => {
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
      (item) => item.isChecked,
    ).length;

    if (vehicleState.type === 'Truck') {
      setTrucksList((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId ? { ...vehicle, checks: totalChecks } : vehicle,
        ),
      );
    } else {
      setTrailersList((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId ? { ...vehicle, checks: totalChecks } : vehicle,
        ),
      );
    }
  };

  const updateFaultCounter = (
    vehicleId: string,
    vehicleState: VehicleChecklistState,
  ) => {
    const totalFaults = Object.values(vehicleState.checklistItems).filter(
      (item) => !!item.fault,
    ).length;

    if (vehicleState.type === 'Truck') {
      setTrucksList((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId ? { ...vehicle, faults: totalFaults } : vehicle,
        ),
      );
    } else {
      setTrailersList((prevVehicles) =>
        prevVehicles.map((vehicle) =>
          vehicle.id === vehicleId ? { ...vehicle, faults: totalFaults } : vehicle,
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

    const completedItems = Object.values(checklistItems).reduce((acc, item) => {
      return acc + (item.isChecked || item.fault ? 1 : 0);
    }, 0);

    const progressPercent = (completedItems / totalItems) * 100;
    return progressPercent.toFixed(0);
  };

  const getProgressBarColor = (progress: number) => {
    if (progress < 30) return 'red';
    if (progress < 100) return 'yellow';
    return 'green';
  };

  const toggleSwitch = (vehicleId: string, itemId: string) => {
    setSwitchState((prevState) => {
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

    setSwitchState((prevState) => {
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

    setFaultDescriptions((prev) => ({
      ...prev,
      [currentItemId]: problemDescription,
    }));

    setProblemDescription('');
    setModalVisible(false);
  };

  const getNonValidatedItems = (checklist: Record<string, VehicleChecklistState>) => {
    const nonValidatedItems: string[] = [];

    Object.values(checklist).forEach((vehicle) => {
      Object.values(vehicle.checklistItems).forEach((item) => {
        if (!item.isChecked && !item.fault) {
          nonValidatedItems.push(
            `${item.label} (${vehicle.name || vehicle.number || vehicle.truckId})`,
          );
        }
      });
    });

    return nonValidatedItems;
  };

  const handleGenerateReportPress = () => {
    const truckChecklist: Record<string, VehicleChecklistState> = {};
    const trailerChecklist: Record<string, VehicleChecklistState> = {};

    Object.keys(switchState).forEach((vehicleId) => {
      const vehicleData = switchState[vehicleId];

      if (vehicleData.type === 'Truck') {
        truckChecklist[vehicleId] = { ...vehicleData };
      } else if (vehicleData.type === 'Trailer') {
        trailerChecklist[vehicleId] = { ...vehicleData };
      }
    });

    const truckIds = Object.keys(truckChecklist);
    const trailerIds = Object.keys(trailerChecklist);
    const reportId =
      truckIds.length > 0 && trailerIds.length > 0
        ? `${truckIds[0]}_${trailerIds[0]}`
        : truckIds.length > 0
          ? truckIds[0]
          : 'NO_ID';

    const nonValidatedTruckItems = getNonValidatedItems(truckChecklist);
    const nonValidatedTrailerItems = getNonValidatedItems(trailerChecklist);

    if (nonValidatedTruckItems.length > 0 || nonValidatedTrailerItems.length > 0) {
      const nonValidatedItems = [
        ...nonValidatedTruckItems,
        ...nonValidatedTrailerItems,
      ];

      Alert.alert(
        localized('Error'),
        `${localized('Review this items:')}\n${nonValidatedItems.join('\n')}`,
      );
      return;
    }

    const reportData = {
      reportID: reportId,
      driver: currentUser,
      truckChecklist,
      trailerChecklist,
      truckID: truckIds[0] || null,
      trailerID: trailerIds[0] || null,
      dateReport: serializeDate(currentDate),
      timeReport: currentTime,
      dispatchCarrier: normalizedVehicles[0]?.dispatchCarrier || null,
      carrier: normalizedVehicles[0]?.vendor || null,
      miles: odometerReading,
      inspectionID: `${reportId}_${new Date().getTime()}`,
      vehicles: normalizedVehicles,
      channelID: activeJob?.channelID || null,
      projectID: activeJob?.projectID || null,
      jobID: activeJob?.jobID || null,
    };

    navigation.navigate('PreviewInspection', { reportData });
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
        size={30}
        style={styles.itemButton}
      />
    );
  };

  const renderItem = ({ item }: { item: ResourceItem }) => {
    const isSelected = item.id === selectedItemId;
    const progress = Number(calculateProgress(item.id));
    const progressBarColor = getProgressBarColor(progress);

    const handlePress = (selectedVehicle: ResourceItem) => {
      if (currentItem && currentItem.id === selectedVehicle.id) {
        setIsChecklistVisible(!isChecklistVisible);
      } else {
        setCurrentItem(selectedVehicle);
        setIsChecklistVisible(true);
      }
      setSelectedItemId(selectedVehicle.id);
    };

    return (
      <TouchableOpacity style={styles.item} onPress={() => handlePress(item)}>
        <View style={styles.vehicleInfoContainer}>
          <VehicleIcon
            type={item.type}
            color={isSelected ? 'green' : 'black'}
          />
          <View style={styles.rightContainer}>
            <Text style={styles.labelValue}>
              {item.type} No: {item.name || item.number || item.id}
            </Text>
            <Text style={styles.labelValue}>
              {localized('Checks')}: {item.checks || 0}
            </Text>
            <Text style={styles.labelValue}>
              {localized('Faults')}: {item.faults || 0}
            </Text>
            <Text style={styles.labelValue}>
              {localized('Progress')}: {progress}%
            </Text>
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress}%`,
                backgroundColor: progressBarColor,
              },
            ]}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!isChecklistVisible || !currentItem) {
      return null;
    }

    const currentChecklistItems =
      currentItem.type === "Truck" ? truckTemplateItems : trailerTemplateItems;

    const currentVehicleState = switchState[currentItem.id];

    return (
      <View>
        <View style={styles.footerContainer}>
          <View style={styles.checklistContainer}>
            {currentChecklistItems.map((item: any) => (
              <View key={item.id} style={styles.checklistItem}>
                <TouchableOpacity
                  style={styles.labelTouchable}
                  onPress={() => toggleSwitch(currentItem.id, item.id)}
                >
                  <Text style={styles.label}>{item.label}</Text>
                </TouchableOpacity>

                <View style={styles.controlsContainer}>
                  <Switch
                    onValueChange={() => toggleSwitch(currentItem.id, item.id)}
                    value={
                      currentVehicleState?.checklistItems?.[item.id]
                        ?.isChecked || false
                    }
                    style={[
                      styles.switchStyle,
                      Platform.OS === "android" && {
                        transform: [{ scaleX: 1 }, { scaleY: 1 }],
                      },
                    ]}
                  />

                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={18}
                    color={
                      currentVehicleState?.checklistItems?.[item.id]?.fault
                        ? "red"
                        : "gray"
                    }
                    onPress={() => handleReportFault(currentItem.id, item.id)}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  if (vehiclesLoading || !templatesReady) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
        <Text style={styles.emptyText}>
          {localized("Loading inspection...")}
        </Text>
      </View>
    );
  }

  if (!normalizedVehicles.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>{localized('No Vehicles Assigned')}</Text>
        <Text style={styles.emptyText}>
          {localized(
            'You do not have assigned vehicles available for inspection.',
          )}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>{localized('Carrier')}</Text>
          <Text style={styles.info}>
            {normalizedVehicles[0]?.vendor?.title || '—'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>{localized('Date')}</Text>
          <Text style={styles.info}>{formatDate(currentDate)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>{localized('Odometer Reading')}</Text>
          <TextInput
            style={styles.input}
            placeholder={localized('Enter Odometer Reading')}
            value={odometerReading}
            onChangeText={handleInputChange}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.flatListContainer}>
        <FlatList
          data={trucksList.concat(trailersList)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          initialNumToRender={4}
          numColumns={2}
          columnWrapperStyle={styles.column}
          ListFooterComponent={renderFooter}
        />
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
                <Text style={styles.buttonText}>{localized('Confirm')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>{localized('Return')}</Text>
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
          <Text style={styles.backButtonText}>{localized('Go to Sign')}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default InspectionScreen;