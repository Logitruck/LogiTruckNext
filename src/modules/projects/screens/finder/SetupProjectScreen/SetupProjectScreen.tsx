import React, { useLayoutEffect, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import StatusTabs from '../../../../../core/components/StatusTabs';

import SetupStepName from './steps/SetupStepName';
import SetupStepRoutes from './steps/SetupStepRoutes';
import SetupStepContacts from './steps/SetupStepContacts';
import SetupStepInstructions from './steps/SetupStepInstructions';
import SetupStepReview from './steps/SetupStepReview';

import useSaveProjectData from '../../../hooks/shared/useSaveProjectData';
import useProjectSetupDetails from '../../../hooks/shared/useProjectSetupDetails';

const SETUP_TABS = [
  { key: 'name', label: 'Name', icon: 'format-title' },
  { key: 'routes', label: 'Routes', icon: 'map-marker-path' },
  { key: 'contacts', label: 'Contacts', icon: 'account-box-outline' },
  { key: 'instructions', label: 'Instructions', icon: 'clipboard-text-outline' },
  { key: 'review', label: 'Review', icon: 'check-decagram' },
];

const SetupProjectScreen = ({ navigation, route }: any) => {
  const { channelID, projectID } = route.params || {};
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { saveProjectData } = useSaveProjectData();
  const { project, loading } = useProjectSetupDetails(channelID, projectID);


  const [activeTab, setActiveTab] = useState('name');
  const [projectData, setProjectData] = useState<any | null>(null);
  const [isStepValid, setIsStepValid] = useState(false);

  useEffect(() => {
    if (!project) return;

    setProjectData({
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
    });
  }, [project, channelID, projectID]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Project Setup'),
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

  if (loading || !projectData) {
    return (
      <View style={styles.container}>
        <StatusTabs
          tabs={SETUP_TABS}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        <View style={styles.loaderContainer}>
          <Text style={styles.loadingText}>{localized('Loading project...')}</Text>
        </View>
      </View>
    );
  }

  const sharedProps = {
    data: projectData,
    setData: setProjectData,
    onValidationChange: setIsStepValid,
  };

  const renderActiveStep = () => {
    switch (activeTab) {
      case 'name':
        return <SetupStepName {...sharedProps} />;
      case 'routes':
        return <SetupStepRoutes {...sharedProps} />;
      case 'contacts':
        return <SetupStepContacts {...sharedProps} />;
      case 'instructions':
        return <SetupStepInstructions {...sharedProps} />;
      case 'review':
        return <SetupStepReview data={projectData} navigation={navigation} />;
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
      Alert.alert(localized('Error'), localized('Error saving project data.'));
    }
  };

  const handleNext = async () => {
    const currentIndex = SETUP_TABS.findIndex((t) => t.key === activeTab);
    if (currentIndex < SETUP_TABS.length - 1) {
      await saveCurrentStep();
      setActiveTab(SETUP_TABS[currentIndex + 1].key);
    }
  };

  const handleBack = async () => {
    const currentIndex = SETUP_TABS.findIndex((t) => t.key === activeTab);
    if (currentIndex > 0) {
      await saveCurrentStep();
      setActiveTab(SETUP_TABS[currentIndex - 1].key);
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
            {activeTab !== 'name' && (
              <Pressable style={styles.footerButton} onPress={handleBack}>
                <MaterialCommunityIcons name="arrow-left" size={20} color="white" />
                <Text style={styles.footerButtonText}>{localized('Back')}</Text>
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
                <Text style={styles.footerButtonText}>{localized('Next')}</Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default SetupProjectScreen;