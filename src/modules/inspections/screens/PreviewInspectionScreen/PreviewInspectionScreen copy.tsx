import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  CommonActions,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import Signature from 'react-native-signature-canvas';
import Pdf from 'react-native-pdf';
import NetInfo from '@react-native-community/netinfo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import { formatDate } from '../../../../utils/dateUtils';
import useUploadSignedInspectionReport from '../../hooks/useUploadSignedInspectionReport';
import usePendingInspectionSync from '../../hooks/usePendingInspectionSync';
import { savePendingInspectionReport } from '../../services/inspectionStorageService';

const RNHTMLtoPDF = require('react-native-html-to-pdf');

type DriverReportChecklistItem = {
  isChecked: boolean;
  label: string;
  fault: string;
  vehicleType?: 'Truck' | 'Trailer';
};

type DriverReport = {
  checklist: Record<string, DriverReportChecklistItem>;
  miles?: string;
  dateReport?: string | null;
  timeReport?: string;
  signature?: string;
  signatureURL?: string;
  signedAt?: any;
  signedBy?: any;
};

type ReviewReport = {
  reviewedBy?: any;
  reviewedAt?: any;
  reviewSignature?: string;
  reviewSignatureURL?: string;
  resolutionNotes?: string;
  correctedItems?: any[];
  finalDecision?: string | null;
  canContinueOperation?: boolean | null;
};

type InspectionReport = {
  reportID: string;
  inspectionID: string;
  vendorID?: string | null;
  vehicleID: string;
  vehicleType: 'Truck' | 'Trailer';
  driver?: any;
  dispatchCarrier?: any;
  carrier?: any;
  channelID?: string | null;
  projectID?: string | null;
  jobID?: string | null;
  driverReport: DriverReport;
  reviewReport?: ReviewReport;
  statusReport?: string;
};

type PreviewInspectionRouteParams = {
  role?: 'driver' | 'reviewer';
  inspectionMode?: 'separate' | 'combined';
  reportData?: InspectionReport;
  reports?: InspectionReport[];
  returnTo?: 'driver' | 'carrier';
};

const escapeHtml = (value: unknown) => {
  const stringValue = String(value ?? '—');
  return stringValue
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const normalizeReportsInput = (
  params?: PreviewInspectionRouteParams,
): InspectionReport[] => {
  if (Array.isArray(params?.reports) && params.reports.length > 0) {
    return params.reports.filter(Boolean);
  }

  if (params?.reportData) {
    return [params.reportData];
  }

  return [];
};

const buildChecklistRows = (
  checklistItems: Record<string, DriverReportChecklistItem> = {},
  localized: (key: string) => string,
) => {
  const items = Object.values(checklistItems || {});

  if (!items.length) {
    return `
      <tr>
        <td colspan="3" style="padding: 8px; border: 1px solid #ccc;">
          ${escapeHtml(localized('No checklist items'))}
        </td>
      </tr>
    `;
  }

  return items
    .map((item: DriverReportChecklistItem) => {
      const status = item?.isChecked
        ? localized('OK')
        : item?.fault
          ? localized('Fault Reported')
          : localized('Pending');

      return `
        <tr>
          <td style="padding: 8px; border: 1px solid #ccc;">${escapeHtml(item?.label)}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${escapeHtml(status)}</td>
          <td style="padding: 8px; border: 1px solid #ccc;">${escapeHtml(item?.fault || '—')}</td>
        </tr>
      `;
    })
    .join('');
};

const buildSingleReportHtml = (
  report: InspectionReport,
  localized: (key: string) => string,
  signatureMap: Record<string, string>,
) => {
  const driverName = [
    report?.driver?.firstName || '',
    report?.driver?.lastName || '',
  ]
    .join(' ')
    .trim();

  const carrierName =
    report?.carrier?.title ||
    report?.dispatchCarrier?.title ||
    '—';

  const checklist = report?.driverReport?.checklist || {};
  const signature =
    roleAwareSignature(report, signatureMap);

  return `
    <div style="margin-bottom: 28px; page-break-inside: avoid;">
      <h3 style="margin-bottom: 12px;">
        ${escapeHtml(localized('Vehicle Inspection'))} - ${escapeHtml(report?.vehicleType)}
      </h3>

      <div style="margin-bottom: 14px;">
        <p><strong>${escapeHtml(localized('Carrier'))}:</strong> ${escapeHtml(carrierName)}</p>
        <p><strong>${escapeHtml(localized('Driver'))}:</strong> ${escapeHtml(driverName || '—')}</p>
        <p><strong>${escapeHtml(localized('Vehicle ID'))}:</strong> ${escapeHtml(report?.vehicleID)}</p>
        <p><strong>${escapeHtml(localized('Vehicle Type'))}:</strong> ${escapeHtml(report?.vehicleType)}</p>
        <p><strong>${escapeHtml(localized('Inspection ID'))}:</strong> ${escapeHtml(report?.inspectionID)}</p>
        <p><strong>${escapeHtml(localized('Job ID'))}:</strong> ${escapeHtml(report?.jobID || '—')}</p>
        <p><strong>${escapeHtml(localized('Project ID'))}:</strong> ${escapeHtml(report?.projectID || '—')}</p>
        <p><strong>${escapeHtml(localized('Channel ID'))}:</strong> ${escapeHtml(report?.channelID || '—')}</p>
        <p><strong>${escapeHtml(localized('Date'))}:</strong> ${
          report?.driverReport?.dateReport
            ? escapeHtml(formatDate(new Date(report.driverReport.dateReport)))
            : '—'
        }</p>
        <p><strong>${escapeHtml(localized('Time'))}:</strong> ${escapeHtml(report?.driverReport?.timeReport || '—')}</p>
        <p><strong>${escapeHtml(localized('Odometer Reading'))}:</strong> ${escapeHtml(report?.driverReport?.miles || '—')}</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px;">
        <thead>
          <tr>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">
              ${escapeHtml(localized('Item'))}
            </th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">
              ${escapeHtml(localized('Status'))}
            </th>
            <th style="padding: 8px; border: 1px solid #ccc; text-align: left;">
              ${escapeHtml(localized('Fault'))}
            </th>
          </tr>
        </thead>
        <tbody>
          ${buildChecklistRows(checklist, localized)}
        </tbody>
      </table>

      <div style="margin-top: 20px;">
        <p><strong>${escapeHtml(localized('Driver Signature'))}:</strong></p>
        ${
          signature
            ? `<img src="${signature}" style="width: 100%; height: 100px; border: 1px solid #000;" />`
            : `<div style="width: 100%; height: 100px; border: 1px solid #000;"></div>`
        }
      </div>
    </div>
  `;
};

const generatePdfFile = async (html: string, fileName: string) => {
  if (typeof RNHTMLtoPDF?.convert === 'function') {
    return await RNHTMLtoPDF.convert({
      html,
      fileName,
      directory: 'Documents',
    });
  }

  if (typeof RNHTMLtoPDF?.generatePDF === 'function') {
    return await RNHTMLtoPDF.generatePDF({
      html,
      fileName,
      directory: 'Documents',
    });
  }

  throw new Error('RNHTMLtoPDF convert/generatePDF is not available');
};

const roleAwareSignature = (
  report: InspectionReport,
  signatureMap: Record<string, string>,
) => {
  return (
    signatureMap[report?.inspectionID] ||
    report?.driverReport?.signature ||
    ''
  );
};

const PreviewInspectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route?.params || {}) as PreviewInspectionRouteParams;

  const { role = 'driver', returnTo } = params;

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const reports = useMemo<InspectionReport[]>(
    () => normalizeReportsInput(params),
    [params],
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(true);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const [signatureMap, setSignatureMap] = useState<Record<string, string>>({});

  const { upload } = useUploadSignedInspectionReport(localized, navigation);
  usePendingInspectionSync(localized);

  const signatureStyle = `
    .m-signature-pad--body canvas {
      width: 100%;
      height: 200px;
    }
    .m-signature-pad--footer .button {
      background-color: green;
      color: #f2f2f2;
    }
    .m-signature-pad {
      border: 2px solid #000;
      height: 280px;
      box-shadow: none;
    }
    .m-signature-pad--body {
      border: 3px solid #000;
      height: 200px;
    }
  `;

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title:
        role === 'reviewer'
          ? localized('Inspection Review Report')
          : reports.length > 1
            ? localized('Inspection Reports')
            : localized('Inspection Report'),
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
    });
  }, [navigation, localized, theme, appearance, reports.length, role]);

  useEffect(() => {
    const buildPdf = async () => {
      if (!reports.length) {
        setPdfUri(null);
        setProcessingPdf(false);
        return;
      }

      try {
        setProcessingPdf(true);

        const sectionsHtml = reports
          .map((report: InspectionReport) =>
            buildSingleReportHtml(report, localized, signatureMap),
          )
          .join('<hr style="margin: 24px 0;" />');

        const html = `
          <html>
            <body style="font-family: Arial; padding: 24px; color: #111;">
              <h2 style="text-align: center; margin-bottom: 24px;">
                ${
                  role === 'reviewer'
                    ? escapeHtml(localized('Inspection Review Report'))
                    : reports.length > 1
                      ? escapeHtml(localized('Vehicle Inspection Reports'))
                      : escapeHtml(localized('Vehicle Inspection Report'))
                }
              </h2>
              ${sectionsHtml}
            </body>
          </html>
        `;

        const file = await generatePdfFile(
          html,
          `inspection_preview_${role}_${Date.now()}`,
        );

        const resolvedPath = file?.filePath || file?.filePath?.toString?.() || null;

        if (!resolvedPath) {
          throw new Error('PDF filePath not returned by RNHTMLtoPDF');
        }

        setPdfUri(resolvedPath);
      } catch (error) {
        console.error('❌ Error generating inspection PDF:', error);
        setPdfUri(null);
      } finally {
        setProcessingPdf(false);
      }
    };

    buildPdf();
  }, [reports, localized, signatureMap, role]);

  const handleSignature = (sig: string) => {
    try {
      setModalVisible(false);

      if (!reports.length) return;

      const updatedMap: Record<string, string> = {};
      reports.forEach((report: InspectionReport) => {
        if (report?.inspectionID) {
          updatedMap[report.inspectionID] = sig;
        }
      });

      setSignatureMap(updatedMap);
    } catch (error) {
      console.error('❌ Error saving signature:', error);
      Alert.alert(localized('Error'), localized('Could not save signature'));
    }
  };

  const buildSignedReports = (): InspectionReport[] => {
    return reports.map((report: InspectionReport) => {
      const signature = signatureMap[report?.inspectionID] || '';

      if (role === 'reviewer') {
        return {
          ...report,
          reviewReport: {
            ...(report?.reviewReport || {}),
            reviewSignature: signature,
          },
          statusReport: report?.statusReport || 'under_review',
        };
      }

      return {
        ...report,
        driverReport: {
          ...(report?.driverReport || {}),
          signature,
        },
        statusReport: 'driver_submitted',
      };
    });
  };

  const handleSubmit = async () => {
    if (!pdfUri) {
      Alert.alert(
        localized('Error'),
        localized('Missing signed inspection data'),
      );
      return;
    }

    const signedReports = buildSignedReports();

    const missingSignature =
      role === 'reviewer'
        ? signedReports.some(
            (report: InspectionReport) => !report?.reviewReport?.reviewSignature,
          )
        : signedReports.some(
            (report: InspectionReport) => !report?.driverReport?.signature,
          );

    if (missingSignature) {
      Alert.alert(
        localized('Error'),
        localized(
          role === 'reviewer'
            ? 'Please sign the review report before submitting'
            : 'Please sign the inspection report before submitting',
        ),
      );
      return;
    }

    try {
      setUploading(true);

      const netState = await NetInfo.fetch();
      const isOnline = !!netState.isConnected && !!netState.isInternetReachable;

      if (isOnline) {
        for (const report of signedReports) {
          await upload(
            report,
            role,
            pdfUri,
            role === 'reviewer'
              ? report?.reviewReport?.reviewSignature || ''
              : report?.driverReport?.signature || '',
            {
              navigateOnSuccess: false,
              showAlerts: false,
            },
          );
        }
      } else {
        for (const report of signedReports) {
          await savePendingInspectionReport({
            id: `${report?.inspectionID}_${role}`,
            role,
            reportData: report,
            pdfUri,
            signatureDataUrl:
              role === 'reviewer'
                ? report?.reviewReport?.reviewSignature || ''
                : report?.driverReport?.signature || '',
          });
        }

        Alert.alert(
          localized('Offline'),
          localized(
            'No internet connection. The report was saved locally and will sync automatically when connection is restored.',
          ),
        );

        navigation.goBack();
        return;
      }

      Alert.alert(
        localized('Success'),
        role === 'reviewer'
          ? localized('Inspection review uploaded successfully')
          : reports.length > 1
            ? localized('Inspection reports uploaded successfully')
            : localized('Inspection report uploaded successfully'),
      );

      if (returnTo === 'carrier' || role === 'reviewer') {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'CarrierMain',
                state: {
                  routes: [{ name: 'InspectionsTab' }],
                },
              },
            ],
          }),
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'DriverMain',
                state: {
                  routes: [{ name: 'DriverHomeTab' }],
                },
              },
            ],
          }),
        );
      }
    } catch (error) {
      console.error('❌ Error submitting inspection report:', error);
      Alert.alert(
        localized('Error'),
        localized('Failed to upload signed inspection report'),
      );
    } finally {
      setUploading(false);
    }
  };

  const renderSummary = () => {
    if (!reports.length) return null;

    return (
      <View style={styles.reportsSummaryBox}>
        <Text style={styles.reportsSummaryTitle}>
          {reports.length > 1
            ? localized('Reports Ready to Submit')
            : localized('Report Ready to Submit')}
        </Text>

        {reports.map((report: InspectionReport) => (
          <View key={report.inspectionID} style={styles.reportSummaryRow}>
            <Text style={styles.reportSummaryVehicle}>
              {report?.vehicleType}: {report?.vehicleID}
            </Text>
            <Text style={styles.reportSummaryMeta}>
              {localized('Inspection ID')}: {report?.inspectionID}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      scrollEnabled={isScrollEnabled}
      showsVerticalScrollIndicator={false}
    >
      {renderSummary()}

      {processingPdf ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
          <Text style={styles.infoText}>
            {localized('Generating inspection report...')}
          </Text>
        </View>
      ) : pdfUri ? (
        <Pdf
          source={{ uri: pdfUri }}
          style={styles.pdf}
          trustAllCerts={false}
        />
      ) : (
        <View style={styles.loaderContainer}>
          <Text style={styles.infoText}>
            {localized('Error generating inspection report.')}
          </Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.buttonText}>
            {role === 'reviewer'
              ? localized('Sign as Reviewer')
              : localized('Sign as Driver')}
          </Text>
        </TouchableOpacity>

        {Object.keys(signatureMap).length === reports.length && pdfUri ? (
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit}
            disabled={uploading}
          >
            <Text style={styles.buttonText}>
              {uploading ? localized('Submitting...') : localized('Submit')}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.signatureModal}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <View style={styles.signatureContainer}>
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
            </View>

            <TouchableOpacity
              style={[styles.button, styles.cancelActionButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.buttonText}>{localized('Cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default PreviewInspectionScreen;