import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Signature from 'react-native-signature-canvas';
import Geolocation from '@react-native-community/geolocation';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import useSummaryInspection from '../../../hooks/useSummaryInspection';

type InspectionReport = {
  reportID: string;
  inspectionID: string;
  vendorID?: string | null;
  vehicleID: string;
  vehicleType: 'Truck' | 'Trailer';
  inspectionType?: 'pretrip' | 'posttrip';
  inspectionContext?: 'job' | 'standalone';
  inspectionLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  operationContext?: {
    inspectionType?: 'pretrip' | 'posttrip';
    inspectionContext?: 'job' | 'standalone';
  } | null;
  driver?: any;
  dispatchCarrier?: any;
  carrier?: any;
  channelID?: string | null;
  projectID?: string | null;
  jobID?: string | null;
  driverReport: {
    checklist: Record<string, any>;
    miles?: string;
    dateReport?: string | null;
    timeReport?: string;
    signature?: string;
    signatureURL?: string;
    signedAt?: any;
    signedBy?: any;
  };
  reviewReport?: any;
  statusReport?: string;
};

const getCurrentPositionAsync = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      return null;
    }
  }

  return new Promise(resolve => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        console.error('🔥 Error getting inspection location:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  });
};

const SummaryInspectionScreen = ({ route, navigation }: any) => {
  const routeParams = route?.params || {};

  const initialReports: InspectionReport[] = useMemo(() => {
    if (Array.isArray(routeParams?.reports) && routeParams.reports.length > 0) {
      return routeParams.reports;
    }

    if (routeParams?.reportData) {
      return [routeParams.reportData];
    }

    if (
      Array.isArray(routeParams?.params?.reports) &&
      routeParams.params.reports.length > 0
    ) {
      return routeParams.params.reports;
    }

    if (routeParams?.params?.reportData) {
      return [routeParams.params.reportData];
    }

    return [];
  }, [routeParams]);

  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const [modalVisible, setModalVisible] = useState(false);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [reports, setReports] = useState<InspectionReport[]>(initialReports);

  const primaryReport = reports[0] || null;

const {
  signature,
  pdfUri,
  truckCheckedCount,
  trailerCheckedCount,
  truckFaultsCount,
  trailerFaultsCount,
  truckFaultsList,
  trailerFaultsList,
  firstTruckName,
  firstTrailerName,
  handleSignature,
  handleConfirm,
  handleGenerateAndShowPDF,
} = useSummaryInspection({
  reports,
  navigation,
  localized,
  onSignatureSaved: () => setModalVisible(false),
});

  const hasTruckReport = useMemo(
    () => reports.some(item => item?.vehicleType === 'Truck'),
    [reports],
  );

  const hasTrailerReport = useMemo(
    () => reports.some(item => item?.vehicleType === 'Trailer'),
    [reports],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title:
        reports.length > 1
          ? localized('Inspection Summary')
          : localized('Inspection Summary'),
    });
  }, [navigation, localized, reports.length]);

  const signaturePadStyle = `
    .m-signature-pad {
      border: 0;
      box-shadow: none;
      background-color: #ffffff;
    }
    .m-signature-pad--body {
      border: 1px solid #d9d9d9;
      border-radius: 12px;
      overflow: hidden;
    }
    .m-signature-pad--footer .button {
      background-color: #4f46e5;
      color: #ffffff;
      border-radius: 8px;
    }
  `;

  const handleAttachLocation = async () => {
    setLocationLoading(true);
    try {
      const inspectionLocation = await getCurrentPositionAsync();

      setReports(prev =>
        prev.map(report => ({
          ...report,
          inspectionLocation,
        })),
      );

      return inspectionLocation;
    } catch (error) {
      console.error('🔥 Error attaching location to inspection report:', error);
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const buildReportsWithSignature = () => {
    if (!signature) {
      return reports;
    }

    return reports.map(report => ({
      ...report,
      driverReport: {
        ...(report?.driverReport || {}),
        signature,
        signatureURL: signature,
      },
    }));
  };

  const handleConfirmWithLocation = async () => {
    await handleAttachLocation();

    const signedReports = buildReportsWithSignature();

    if (signedReports.length === 1) {
      handleConfirm(signedReports[0]);
      return;
    }

    navigation.navigate('PreviewInspection', {
      reports: signedReports,
      role: 'driver',
      inspectionMode: routeParams?.inspectionMode || 'separate',
    });
  };

  const handlePreviewWithLocation = async () => {
    await handleAttachLocation();

    const signedReports = buildReportsWithSignature();

    if (signedReports.length === 1) {
      handleGenerateAndShowPDF(signedReports[0]);
      return;
    }

    navigation.navigate('PreviewInspection', {
      reports: signedReports,
      role: 'driver',
      inspectionMode: routeParams?.inspectionMode || 'separate',
    });
  };

  if (!reports.length || !primaryReport) {
    return (
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>{localized('Summary')}</Text>
          <Text style={styles.itemText}>
            {localized('No inspection data was received')}
          </Text>
        </View>
      </View>
    );
  }

  console.log('🟣 SummaryInspection route.params:', route?.params);
  console.log('🟣 SummaryInspection reports:', reports);

  return (
    <ScrollView
      scrollEnabled={isScrollEnabled}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{localized('Summary')}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {localized('Driver')}: {primaryReport?.driver?.firstName || '—'}{' '}
          {primaryReport?.driver?.lastName || ''}
        </Text>

        <Text style={styles.itemText}>
          {localized('Inspection Type')}:{' '}
          {localized(
            primaryReport?.inspectionType === 'posttrip' ? 'Posttrip' : 'Pretrip',
          )}
        </Text>

        <Text style={styles.itemText}>
          {localized('Inspection Context')}:{' '}
          {localized(
            primaryReport?.inspectionContext === 'job' ? 'Job' : 'Standalone',
          )}
        </Text>

        <Text style={styles.itemText}>
          {localized('Reports Count')}: {reports.length}
        </Text>

        <Text style={styles.itemText}>
          {localized('Report Date')}:{' '}
          {primaryReport?.driverReport?.dateReport || '—'}
        </Text>

        <Text style={styles.itemText}>
          {localized('Miles')}: {primaryReport?.driverReport?.miles || '—'}
        </Text>
      </View>

      {hasTruckReport ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {localized('Truck')}: {firstTruckName || '—'}
          </Text>

          <Text style={styles.itemText}>
            {localized('Checks')}: {truckCheckedCount}
          </Text>

          <Text style={styles.itemText}>
            {localized('Faults')}: {truckFaultsCount}
          </Text>

          <View style={styles.faultList}>
            <Text style={styles.faultListTitle}>
              {localized('Faults Description')}
            </Text>

            {truckFaultsList.length > 0 ? (
              truckFaultsList.map((fault, index) => (
                <Text key={`${fault.label}-${index}`} style={styles.faultItem}>
                  {fault.label}: {fault.fault}
                </Text>
              ))
            ) : (
              <Text style={styles.itemText}>{localized('No reported')}</Text>
            )}
          </View>
        </View>
      ) : null}

      {hasTrailerReport ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {localized('Trailer')}: {firstTrailerName || '—'}
          </Text>

          <Text style={styles.itemText}>
            {localized('Checks')}: {trailerCheckedCount}
          </Text>

          <Text style={styles.itemText}>
            {localized('Faults')}: {trailerFaultsCount}
          </Text>

          <View style={styles.faultList}>
            <Text style={styles.faultListTitle}>
              {localized('Faults Description')}
            </Text>

            {trailerFaultsList.length > 0 ? (
              trailerFaultsList.map((fault, index) => (
                <Text key={`${fault.label}-${index}`} style={styles.faultItem}>
                  {fault.label}: {fault.fault}
                </Text>
              ))
            ) : (
              <Text style={styles.itemText}>{localized('No reported')}</Text>
            )}
          </View>
        </View>
      ) : null}

      {signature ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{localized('Driver Signature')}</Text>

          <View style={styles.signatureContainer}>
            <Image
              resizeMode="contain"
              style={styles.signatureImage}
              source={{ uri: signature }}
            />
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>{localized('Driver Sign')}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.bottomButtonsContainer}>
        {!signature ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>
              {localized('Sign report')}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleConfirmWithLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {localized('Send')}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handlePreviewWithLocation}
              disabled={locationLoading}
            >
              <Text style={styles.secondaryButtonText}>
                {localized('Preview Report')}
              </Text>
            </TouchableOpacity>

            {pdfUri ? (
              <Text style={styles.helperText}>
                {localized('Preview generated successfully')}
              </Text>
            ) : null}
          </>
        )}
      </View>
<Modal
  animationType="slide"
  transparent
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={styles.signatureModal}>
      <View style={styles.signaturePadContainer}>
        <Signature
          onBegin={() => setIsScrollEnabled(false)}
          onEnd={() => setIsScrollEnabled(true)}
          onOK={handleSignature}
          onEmpty={() => {}}
          descriptionText={localized('Sign here')}
          clearText={localized('Reset')}
          confirmText={localized('Save')}
          webStyle={signaturePadStyle}
        />
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setModalVisible(false)}
      >
        <Text style={styles.secondaryButtonText}>
          {localized('Close')}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>
    </ScrollView>
  );
};

export default SummaryInspectionScreen;