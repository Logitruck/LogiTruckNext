import React, {
  useLayoutEffect,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import StatusTabs from '../../../../../core/components/StatusTabs';

import SetupStepAvailability from './steps/SetupStepAvailability';
import SetupStepNotes from './steps/SetupStepNotes';
import SetupStepReview from './steps/SetupStepReview';
import SetupStepResources from './steps/SetupStepResources';
import SetupStepPersonnel from './steps/SetupStepPersonnel';

import useSaveProjectData from '../../../hooks/shared/useSaveProjectData';
import useProjectSetupDetails from '../../../hooks/shared/useProjectSetupDetails';

const SETUP_TABS = [
  { key: 'resources', label: 'Vehículos', icon: 'truck' },
  { key: 'personnel', label: 'Personal', icon: 'account-group' },
  { key: 'availability', label: 'Disponibilidad', icon: 'calendar-clock' },
  { key: 'notes', label: 'Notas', icon: 'note-text' },
  { key: 'review', label: 'Resumen', icon: 'check-decagram' },
];

const CarrierProjectSetupScreen = ({ navigation, route }: any) => {
  const { channelID, projectID } = route.params || {};

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { saveProjectData } = useSaveProjectData();
  const { project, loading } = useProjectSetupDetails(channelID, projectID);

  const [activeTab, setActiveTab] = useState('resources');
  const [projectData, setProjectData] = useState<any | null>(null);
  const [isStepValid, setIsStepValid] = useState(false);

  const builtProjectData = useMemo(() => {
    if (!project) return null;

    return {
      id: projectID,
      channelID,
      requestID: project?.requestID ?? projectID,
      finderID: project?.finderID ?? '',
      vendorID: project?.vendorID ?? '',
      status: project?.status ?? 'setup',
      name: project?.name ?? '',
      routes: Array.isArray(project?.routes) ? project.routes : [],
      totalRoutes: project?.totalRoutes ?? 0,
      totalTrips: project?.totalTrips ?? 0,
      acceptedOffer: project?.acceptedOffer ?? null,
      averageDieselPrice: project?.averageDieselPrice ?? null,
      suggestedPriceRange: project?.suggestedPriceRange ?? null,
      contacts: project?.contacts ?? {},
      instructions: project?.instructions ?? [],
      carrierResources: project?.carrierResources ?? {
        trucks: [],
        trailers: [],
      },
      carrierPersonnel: project?.carrierPersonnel ?? {
        drivers: [],
        dispatchers: [],
      },
      availability: project?.availability ?? {},
      notes: project?.notes ?? '',
    };
  }, [project, channelID, projectID]);

  useEffect(() => {
    if (!builtProjectData) return;

    setProjectData((prev: any) => {
      if (!prev) return builtProjectData;

      const prevSerialized = JSON.stringify(prev);
      const nextSerialized = JSON.stringify(builtProjectData);

      if (prevSerialized === nextSerialized) {
        return prev;
      }

      return builtProjectData;
    });
  }, [builtProjectData]);

  const handleValidationChange = useCallback((value: boolean) => {
    setIsStepValid((prev) => (prev === value ? prev : value));
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Carrier Project Setup'),
      headerBackTitleVisible: false,
      headerLeft: () => (
        <MaterialCommunityIcons
          name="arrow-left"
          size={24}
          color={colors.primaryText}
          style={{ marginLeft: 16 }}
          onPress={() => navigation.goBack()}
        />
      ),
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, localized, colors.primaryText, colors.primaryBackground]);

  const sharedProps = useMemo(
    () => ({
      data: projectData,
      setData: setProjectData,
      onValidationChange: handleValidationChange,
    }),
    [projectData, handleValidationChange]
  );

  if (loading || !projectData) {
    return (
      <View style={styles.container}>
        <StatusTabs
          tabs={SETUP_TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={colors.primaryForeground}
          />
          <Text style={styles.loadingText}>
            {localized('Loading project...')}
          </Text>
        </View>
      </View>
    );
  }

  const renderActiveStep = () => {
    switch (activeTab) {
      case 'resources':
        return <SetupStepResources {...sharedProps} />;

      case 'personnel':
        return <SetupStepPersonnel {...sharedProps} />;

      case 'availability':
        return <SetupStepAvailability {...sharedProps} />;

      case 'notes':
        return <SetupStepNotes {...sharedProps} />;

      case 'review':
        return (
          <SetupStepReview
            data={projectData}
            navigation={navigation}
          />
        );

      default:
        return null;
    }
  };

  const saveCurrentStep = async () => {
    try {
      await saveProjectData({
        channelID,
        projectID,
        data: projectData,
      });
    } catch (error) {
      console.error('❌ Error saving carrier project step:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not save the project.'),
      );
    }
  };

  const handleNext = async () => {
    const index = SETUP_TABS.findIndex((tab) => tab.key === activeTab);

    if (index < SETUP_TABS.length - 1) {
      await saveCurrentStep();
      setActiveTab(SETUP_TABS[index + 1].key);
    }
  };

  const handleBack = async () => {
    const index = SETUP_TABS.findIndex((tab) => tab.key === activeTab);

    if (index > 0) {
      await saveCurrentStep();
      setActiveTab(SETUP_TABS[index - 1].key);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.container}>
        <StatusTabs
          tabs={SETUP_TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {renderActiveStep()}
        </ScrollView>

        <View style={styles.footerButtonsContainer}>
          <View style={styles.footerButtons}>
            {activeTab !== 'resources' && (
              <Pressable
                style={styles.footerButton}
                onPress={handleBack}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={20}
                  color="white"
                />
                <Text style={styles.footerButtonText}>
                  {localized('Back')}
                </Text>
              </Pressable>
            )}

            {activeTab !== 'review' && (
              <Pressable
                style={[
                  styles.footerButton,
                  !isStepValid && styles.disabledButton,
                ]}
                onPress={handleNext}
                disabled={!isStepValid}
              >
                <Text style={styles.footerButtonText}>
                  {localized('Next')}
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={20}
                  color="white"
                />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CarrierProjectSetupScreen;