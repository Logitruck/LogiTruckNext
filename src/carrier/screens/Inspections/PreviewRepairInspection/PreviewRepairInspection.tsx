import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import Pdf from 'react-native-pdf';
import Signature from 'react-native-signature-canvas';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';
import { deserializeDate, formatDate } from '../../../../utils/dateUtils';
import useNetworkStatus from '../../../../modules/inspections/hooks/useNetworkStatus';
import {
  getPendingReports,
  markReportAsSynced,
  saveReportLocally,
} from '../../../../modules/inspections/services/inspectionStorageService';
import useInspectionReportMutations from '../../../../modules/inspections/hooks/useInspectionReportMutations';
import useInspectionPDF from '../../../../modules/inspections/hooks/useInspectionPDF';

const RNHTMLtoPDF = require('react-native-html-to-pdf');
let isSyncing = false;

const PreviewRepairInspectionScreen = ({ route, navigation }: any) => {
  const { reportData } = route.params || {};
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const { isOnline } = useNetworkStatus();

  const currentUser = useSelector((state: any) => state.auth.user);
  const { saveInspectionReport, uploadPDF } = useInspectionReportMutations();

  const [mechanicSignature, setMechanicSignature] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [inspectionID, setInspectionID] = useState(
    reportData?.inspectionID || '',
  );
  const [processingPdf, setProcessingPdf] = useState(false);
  const [sending, setSending] = useState(false);

  const driverSignature = reportData?.signature || '';
 const { generateFinalInspectionPDF } = useInspectionPDF();

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized("Mechanic's Inspection Report"),
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
    if (!reportData?.inspectionID) return;
    setInspectionID(reportData.inspectionID);
  }, [reportData?.inspectionID]);

useEffect(() => {
  if (!reportData || !inspectionID) return;

  const buildPdf = async () => {
    try {
      setProcessingPdf(true);

      const generatedPdfPath = await generateFinalInspectionPDF(
        reportData,
        driverSignature,
        mechanicSignature,
        inspectionID,
      );

      setPdfUri(generatedPdfPath);
    } catch (error) {
      console.error('Error preparing PDF:', error);
      Alert.alert(
        localized('Error'),
        localized('Error while processing the report'),
      );
    } finally {
      setProcessingPdf(false);
    }
  };

  buildPdf();
}, [
  reportData,
  inspectionID,
  driverSignature,
  mechanicSignature,
  generateFinalInspectionPDF,
  localized,
]);

  useEffect(() => {
    if (isOnline) {
      syncReportsIfNeeded();
    }
  }, [isOnline]);

  const signatureStyle = useMemo(
    () => `
      .m-signature-pad--body canvas {
        position: absolute;
        left: 0;
        top: 300;
        width: 100%;
        height: 200px;
        border-radius: 4px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.02) inset;
      }
      .m-signature-pad--footer .button {
        background-color: green;
        color: #f2f2f2;
      }
      .m-signature-pad {
        border: 2px solid #000;
        height: 280px;
      }
      .m-signature-pad--body {
        border: 3px solid #000;
        align: center;
        height: 200px;
      }
    `,
    [],
  );


  const syncPendingReports = async () => {
    const reports = await getPendingReports();

    for (const { key, data: report } of reports) {
      try {
        report.dataToSend.dateReport = new Date(report.dataToSend.dateReport);

        if (report.dataToSend.timeReport) {
          report.dataToSend.timeReport = new Date(report.dataToSend.timeReport);
        }

        const uploadedPdfUrl = await uploadPDF(
          report.filePath,
          report.dataToSend.inspectionID,
        );

        if (!uploadedPdfUrl) {
          throw new Error('Failed to upload the PDF.');
        }

        const pendingDataToSend = {
          ...report.dataToSend,
          pdfURL: uploadedPdfUrl,
        };

        const saveResult = await saveInspectionReport(
          pendingDataToSend,
          currentUser,
        );

        if (!saveResult) {
          throw new Error('Failed to save the report.');
        }

        await markReportAsSynced(key, report);

        Alert.alert(localized('Success'), localized('Report Sent'));
        navigation.navigate('InspectionsHome');
      } catch (error) {
        console.error(
          `Error syncing report ${report?.dataToSend?.reportID}:`,
          error,
        );
      }
    }
  };

  const syncReportsIfNeeded = async () => {
    if (isOnline && !isSyncing) {
      isSyncing = true;
      await syncPendingReports();
      isSyncing = false;
    }
  };

  const handleConfirm = async () => {
    try {
      if (!pdfUri) {
        Alert.alert(localized('Error'), localized('The PDF is not ready yet.'));
        return;
      }

      setSending(true);

      const dataToSend = {
        ...reportData,
        vendorID:
          reportData?.vendorID ||
          reportData?.carrier?.id ||
          reportData?.dispatchCarrier?.id ||
          '',
        signature: mechanicSignature,
        driverSignature,
        driverSignedAt: deserializeDate(reportData.dateReport),
        mechanicSignedAt: new Date(),
        mechanicSignedBy: {
          uid: currentUser?.id || currentUser?.userID || '',
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || '',
          role: 'dispatcher',
        },
        statusReport: 'Approved by Mechanics',
        dateReportDispatch: deserializeDate(reportData.dateReportDispatch),
      };

      if (isOnline) {
        const uploadedPdfUrl = await uploadPDF(pdfUri, inspectionID);

        if (!uploadedPdfUrl) {
          throw new Error('Failed to upload the PDF.');
        }

        const finalDataToSend = {
          ...dataToSend,
          pdfURL: uploadedPdfUrl,
        };

        const saveResult = await saveInspectionReport(
          finalDataToSend,
          currentUser,
        );

        if (!saveResult) {
          throw new Error('Failed to save the report.');
        }

        Alert.alert(localized('Success'), localized('Report Sent'));
      } else {
        await saveReportLocally({
          dataToSend,
          filePath: pdfUri,
        });

        Alert.alert(
          localized('Offline'),
          localized(
            'No internet connection. Report saved locally and will be synced later.',
          ),
        );
      }

      navigation.navigate('InspectionsHome');
    } catch (error: any) {
      console.error('Error sending the report:', error);
      Alert.alert(
        localized('Error'),
        `${localized('Error Sending the report')}: ${error?.message || ''}`,
      );
    } finally {
      setSending(false);
    }
  };

  const handleSignature = async (currentSignature: string) => {
    setMechanicSignature(currentSignature);
    setModalVisible(false);
  };

  return (
    <ScrollView
      scrollEnabled={isScrollEnabled}
      style={styles.containerSummary}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {processingPdf ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.statusText}>
            {localized('Preparing report...')}
          </Text>
        </View>
      ) : pdfUri ? (
        <Pdf
          source={{ uri: pdfUri }}
          onLoadComplete={() => {}}
          onError={(error) => {
            console.error('Failed to load PDF:', error);
          }}
          style={styles.pdf}
        />
      ) : (
        <Text style={styles.backButtonText}>
          {localized('Cannot create the report')}
        </Text>
      )}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.backButtonText}>
            {localized('Sign Report')}
          </Text>
        </TouchableOpacity>

        {mechanicSignature ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleConfirm}
            disabled={sending}
          >
            <Text style={styles.sendButtonText}>
              {sending ? localized('Sending...') : localized('Send Report')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.signatureModal}>
            <Signature
              onBegin={() => setIsScrollEnabled(false)}
              onEnd={() => setIsScrollEnabled(true)}
              onOK={handleSignature}
              onEmpty={() => console.log('Empty')}
              descriptionText={localized('Sign here')}
              clearText={localized('Reset')}
              confirmText={localized('Save')}
              webStyle={signatureStyle}
            />

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.backButtonText}>{localized('Close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PreviewRepairInspectionScreen;