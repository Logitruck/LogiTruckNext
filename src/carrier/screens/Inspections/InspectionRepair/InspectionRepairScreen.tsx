import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';
import { formatDate } from '../../../../utils/dateUtils';
import useFullInspectionDetails from '../../../../modules/inspections/hooks/useFullInspectionDetails';

type ChecklistItem = {
  label?: string;
  fault?: string;
  isChecked?: boolean;
  solution?: string;
  typeSolution?: string;
  vehicleType?: 'Truck' | 'Trailer';
};

type ReviewSolutionItem = ChecklistItem & {
  itemId: string;
  resolved: boolean;
};

type ReviewSolutionsState = Record<string, ReviewSolutionItem>;

type CurrentRepairTarget = {
  itemId: string;
} | null;

const safeFormatFirestoreDate = (
  value: any,
  localized: (key: string) => string,
) => {
  if (!value) {
    return localized('No date');
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

    return localized('No date');
  } catch {
    return localized('No date');
  }
};

const InspectionRepairScreen = ({ route, navigation }: any) => {
  const inspectionRef = route?.params?.inspectionRef || {};
  const { inspectionID, vehicleID, vendorID } = inspectionRef;

  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const { inspectionData, loading, error } = useFullInspectionDetails(
    vendorID,
    inspectionID,
    vehicleID,
  );

  const [odometerReading, setOdometerReading] = useState('');
  const [reviewSolutions, setReviewSolutions] = useState<ReviewSolutionsState>(
    {},
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [problemDescription, setProblemDescription] = useState('');
  const [solutionType, setSolutionType] = useState('');
  const [currentTarget, setCurrentTarget] = useState<CurrentRepairTarget>(null);
  const [finalDecision, setFinalDecision] = useState<string | null>(null);
  const [canContinueOperation, setCanContinueOperation] = useState<
    boolean | null
  >(null);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Inspection Review'),
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
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, localized, theme, appearance]);

  useEffect(() => {
    if (!inspectionData) return;

    setOdometerReading(String(inspectionData?.driverReport?.miles || ''));

    const initialSolutions: ReviewSolutionsState = {};
    const checklist = inspectionData?.driverReport?.checklist || {};

    Object.entries(checklist).forEach(([itemId, item]: [string, any]) => {
      if (item?.fault) {
        initialSolutions[itemId] = {
          itemId,
          label: item?.label || '',
          fault: item?.fault || '',
          isChecked: item?.isChecked || false,
          solution: item?.solution || '',
          typeSolution: item?.typeSolution || '',
          vehicleType: item?.vehicleType || inspectionData?.vehicleType,
          resolved: !!item?.solution,
        };
      }
    });

    setReviewSolutions(initialSolutions);

    const existingReview = inspectionData?.reviewReport || null;
    setFinalDecision(existingReview?.finalDecision || null);
    setCanContinueOperation(
      existingReview?.canContinueOperation ?? null,
    );
  }, [inspectionData]);

  const driverReportDate = safeFormatFirestoreDate(
    inspectionData?.driverReport?.dateReport,
    localized,
  );

  const currentDate = formatDate(new Date());

  const handleSwitchChange = (itemId: string, value: boolean) => {
    setReviewSolutions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        resolved: value,
      },
    }));
  };

  const handleSaveProblemDescription = () => {
    if (!currentTarget) return;

    if (!problemDescription.trim() || !solutionType) {
      Alert.alert(
        localized('Error'),
        localized('Please enter a description and select a solution type.'),
      );
      return;
    }

    

    setReviewSolutions(prev => ({
      ...prev,
      [currentTarget.itemId]: {
        ...prev[currentTarget.itemId],
        solution: problemDescription.trim(),
        typeSolution: solutionType,
        resolved: true,
      },
    }));

    setProblemDescription('');
    setSolutionType('');
    setCurrentTarget(null);
    setModalVisible(false);
  };

  const nonValidatedItems = useMemo(() => {
    return Object.values(reviewSolutions)
      .filter(item => !item?.resolved || !item?.solution || !item?.typeSolution)
      .map(item => item?.label || localized('Unnamed item'));
  }, [reviewSolutions, localized]);

  const faultItems = useMemo(() => {
    return Object.values(reviewSolutions);
  }, [reviewSolutions]);

  const buildCorrectedItems = () => {
    return Object.values(reviewSolutions).map(item => ({
      itemId: item.itemId,
      label: item.label || '',
      fault: item.fault || '',
      actionTaken: item.solution || '',
      typeSolution: item.typeSolution || '',
      resolved: !!item.resolved,
      vehicleType: item.vehicleType || inspectionData?.vehicleType || 'Truck',
    }));
  };

  const deriveFinalStatus = () => {
    if (finalDecision === 'approved') {
      return 'approved_for_operation';
    }

    if (finalDecision === 'blocked') {
      return 'blocked_for_operation';
    }

    return 'under_review';
  };

  const handleOpenRepairExpense = (item?: ReviewSolutionItem) => {
  navigation.navigate('AddRepairExpense', {
    vendorID,
    vehicleID: inspectionData?.vehicleID || vehicleID || null,
    vehicleType:
      inspectionData?.vehicleType || inspectionRef?.vehicleType || 'Truck',
    inspectionID: inspectionData?.inspectionID || inspectionID || null,
    jobID: inspectionData?.jobID || null,
    projectID: inspectionData?.projectID || null,
    channelID: inspectionData?.channelID || null,
    correctedItemLabel: item?.label || '',
  });
};

  const handleGenerateReportPress = () => {
    if (!inspectionData) return;

    if (faultItems.length > 0 && nonValidatedItems.length > 0) {
      Alert.alert(
        localized('Review Required'),
        `${localized('Review these items:')}\n${nonValidatedItems.join('\n')}`,
      );
      return;
    }

    if (!finalDecision) {
      Alert.alert(
        localized('Error'),
        localized('Please select a final decision'),
      );
      return;
    }

    if (canContinueOperation === null) {
      Alert.alert(
        localized('Error'),
        localized('Please indicate if the vehicle can continue operation'),
      );
      return;
    }

    const reportData = {
      ...inspectionData,
      driverReport: {
        ...(inspectionData?.driverReport || {}),
        miles: odometerReading,
      },
      reviewReport: {
        ...(inspectionData?.reviewReport || {}),
        resolutionNotes: buildCorrectedItems()
          .map(item => `${item.label}: ${item.actionTaken}`)
          .join('\n'),
        correctedItems: buildCorrectedItems(),
        finalDecision,
        canContinueOperation,
      },
      statusReport: deriveFinalStatus(),
    };

    navigation.navigate('PreviewInspection', {
  reportData,
  role: 'reviewer',
  returnTo: 'carrier',
});
  };

const renderFaultItem = ({ item }: { item: ReviewSolutionItem }) => {
  return (
    <View style={styles.checklistContainer}>
      <View style={styles.checklistItem}>
        <View style={styles.faultInfoContainer}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.faultText}>{item.fault}</Text>
          {item.solution ? (
            <Text style={styles.solutionText}>
              {localized('Solution')}: {item.solution}
            </Text>
          ) : null}
          {item.typeSolution ? (
            <Text style={styles.solutionText}>
              {localized('Type')}: {item.typeSolution}
            </Text>
          ) : null}
        </View>

        <View style={styles.controlsContainer}>
          <Switch
            value={!!item.resolved}
            onValueChange={value =>
              handleSwitchChange(item.itemId, value)
            }
            style={styles.switchStyle}
          />

          <TouchableOpacity
            style={styles.problemButton}
            onPress={() => {
              setCurrentTarget({ itemId: item.itemId });
              setProblemDescription(item.solution || '');
              setSolutionType(item.typeSolution || '');
              setModalVisible(true);
            }}
          >
            <MaterialCommunityIcons
              name="tools"
              color="orange"
              size={28}
            />
            <Text style={styles.boldText}>
              {localized('Resolve')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.problemButton}
            onPress={() => handleOpenRepairExpense(item)}
          >
            <MaterialCommunityIcons
              name="cash-register"
              color="red"
              size={28}
            />
            <Text style={styles.boldText}>
              {localized('Cost')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      </View>
    );
  }

  if (error || !inspectionData) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.noFaultText}>
          {localized('Could not load inspection data')}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.infoText}>
        {localized('Carrier')}: {inspectionData?.carrier?.title || '-'}
      </Text>

      <Text style={styles.infoText}>
        {localized('Vehicle Type')}: {inspectionData?.vehicleType || '-'}
      </Text>

      <Text style={styles.infoText}>
        {localized('Vehicle ID')}: {inspectionData?.vehicleID || '-'}
      </Text>

      <Text style={styles.infoText}>
        {localized('Date Driver Report')}: {driverReportDate}
      </Text>

      <Text style={styles.infoText}>
        {localized('Date Review')}: {currentDate}
      </Text>

      <Text style={styles.label}>{localized('Odometer Reading')}</Text>
      <TextInput
        value={odometerReading}
        onChangeText={setOdometerReading}
        keyboardType="numeric"
        placeholder={localized('Enter odometer')}
        placeholderTextColor={theme.colors[appearance].secondaryText}
        style={styles.input}
      />

      <Text style={styles.groupHeader}>
        {localized('Reported Faults')}
      </Text>

      {faultItems.length > 0 ? (
        <FlatList
          data={faultItems}
          keyExtractor={item => item.itemId}
          scrollEnabled={false}
          renderItem={renderFaultItem}
        />
      ) : (
        <Text style={styles.noFaultText}>
          {localized('No fault reported')}
        </Text>
      )}

      {faultItems.length > 0 ? (
  <TouchableOpacity
    style={styles.secondaryActionButton}
    onPress={() => handleOpenRepairExpense()}
  >
    <MaterialCommunityIcons
      name="wrench-outline"
      size={22}
      color="red"
    />
    <Text style={styles.secondaryActionText}>
      {localized('Add Repair Cost')}
    </Text>
  </TouchableOpacity>
) : null}

      <View style={styles.decisionSection}>
        <Text style={styles.groupHeader}>
          {localized('Final Decision')}
        </Text>

        <TouchableOpacity
          style={styles.radioContainer}
          onPress={() => setFinalDecision('approved')}
        >
          <MaterialCommunityIcons
            name={
              finalDecision === 'approved'
                ? 'radiobox-marked'
                : 'radiobox-blank'
            }
            size={24}
            color={theme.colors[appearance].primaryText}
          />
          <Text style={styles.radioLabel}>
            {localized('Approve for operation')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioContainer}
          onPress={() => setFinalDecision('blocked')}
        >
          <MaterialCommunityIcons
            name={
              finalDecision === 'blocked'
                ? 'radiobox-marked'
                : 'radiobox-blank'
            }
            size={24}
            color={theme.colors[appearance].primaryText}
          />
          <Text style={styles.radioLabel}>
            {localized('Block operation')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.decisionSection}>
        <Text style={styles.groupHeader}>
          {localized('Can Continue Operation')}
        </Text>

        <TouchableOpacity
          style={styles.radioContainer}
          onPress={() => setCanContinueOperation(true)}
        >
          <MaterialCommunityIcons
            name={
              canContinueOperation === true
                ? 'radiobox-marked'
                : 'radiobox-blank'
            }
            size={24}
            color={theme.colors[appearance].primaryText}
          />
          <Text style={styles.radioLabel}>
            {localized('Yes')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.radioContainer}
          onPress={() => setCanContinueOperation(false)}
        >
          <MaterialCommunityIcons
            name={
              canContinueOperation === false
                ? 'radiobox-marked'
                : 'radiobox-blank'
            }
            size={24}
            color={theme.colors[appearance].primaryText}
          />
          <Text style={styles.radioLabel}>
            {localized('No')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.buttonStyle}
        onPress={handleGenerateReportPress}
      >
        <Text style={styles.buttonText}>{localized('Go to Sign')}</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setCurrentTarget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {localized('Describe Solution')}
            </Text>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.input}
                onChangeText={setProblemDescription}
                value={problemDescription}
                multiline
                numberOfLines={4}
                placeholder={localized('Describe Solution here')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />
            </View>

            <TouchableOpacity
              style={styles.radioContainer}
              onPress={() => setSolutionType('ABOVE DEFECTS CORRECTED')}
            >
              <MaterialCommunityIcons
                name={
                  solutionType === 'ABOVE DEFECTS CORRECTED'
                    ? 'radiobox-marked'
                    : 'radiobox-blank'
                }
                size={24}
                color={theme.colors[appearance].primaryText}
              />
              <Text style={styles.radioLabel}>
                {localized('ABOVE DEFECTS CORRECTED')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioContainer}
              onPress={() =>
                setSolutionType(
                  'ABOVE DEFECTS NEED NOT BE CORRECTED FOR SAFE OPERATION OF VEHICLE',
                )
              }
            >
              <MaterialCommunityIcons
                name={
                  solutionType ===
                  'ABOVE DEFECTS NEED NOT BE CORRECTED FOR SAFE OPERATION OF VEHICLE'
                    ? 'radiobox-marked'
                    : 'radiobox-blank'
                }
                size={24}
                color={theme.colors[appearance].primaryText}
              />
              <Text style={styles.radioLabel}>
                {localized(
                  'ABOVE DEFECTS NEED NOT BE CORRECTED FOR SAFE OPERATION OF VEHICLE',
                )}
              </Text>
            </TouchableOpacity>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.buttonStyle}
                onPress={handleSaveProblemDescription}
              >
                <Text style={styles.buttonText}>{localized('Confirm')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setModalVisible(false);
                  setCurrentTarget(null);
                }}
              >
                <Text style={styles.buttonText}>{localized('Return')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default InspectionRepairScreen;