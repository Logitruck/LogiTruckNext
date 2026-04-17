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
import Geolocation from '@react-native-community/geolocation';

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
  solution?: string;
  typeSolution?: string;
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

type ReviewCorrectedItem = {
  itemId: string;
  label: string;
  fault: string;
  actionTaken?: string;
  typeSolution?: string;
  resolved?: boolean;
  vehicleType?: 'Truck' | 'Trailer';
};

type ReviewReport = {
  reviewedBy?: any;
  reviewedAt?: any;
  reviewSignature?: string;
  reviewSignatureURL?: string;
  resolutionNotes?: string;
  correctedItems?: ReviewCorrectedItem[];
  finalDecision?: string | null;
  canContinueOperation?: boolean | null;
};

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

const safeFormatDate = (value?: any) => {
  if (!value) return '—';

  try {
    if (value instanceof Date) {
      return formatDate(value);
    }

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

    return '—';
  } catch {
    return '—';
  }
};

const getCurrentPositionAsync = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
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

const generateChecklistHTML = (
  checklist: Record<string, DriverReportChecklistItem> = {},
) => {
  const items = Object.values(checklist || {});
  const columns: string[][] = [[], [], []];

  items.forEach((item, index) => {
    const status = item?.isChecked ? '✓' : item?.fault ? 'X' : '-';
    const faultClass = item?.fault ? 'fault' : '';

    const rowHtml = `
      <tr>
        <td>${escapeHtml(item?.label || '—')}</td>
        <td class="${faultClass}">${status}</td>
      </tr>
    `;

    columns[index % 3].push(rowHtml);
  });

  const columnHTML = columns
    .map(
      columnItems => `
        <td style="width: 33.33%; vertical-align: top;">
          <table style="width: 100%;">
            ${columnItems.join('')}
          </table>
        </td>
      `,
    )
    .join('');

  return `
    <table style="width: 100%;">
      <tr>
        ${columnHTML}
      </tr>
    </table>
  `;
};

const generateFaultsHTML = (
  checklist: Record<string, DriverReportChecklistItem> = {},
  localized: (key: string) => string,
) => {
  const faults = Object.values(checklist || {}).filter(item => !!item?.fault);

  if (!faults.length) {
    return `<p>${escapeHtml(localized('No reported faults'))}</p>`;
  }

  const faultsHTML = faults
    .map(
      item => `
        <li style="color: red;">
          ${escapeHtml(item?.label || '—')}: ${escapeHtml(item?.fault || '')}
        </li>
      `,
    )
    .join('');

  return `
    <div class="header">${escapeHtml(localized('Reported Faults'))}</div>
    <ul>
      ${faultsHTML}
    </ul>
  `;
};

const generateReviewSectionHTML = (
  report: InspectionReport,
  localized: (key: string) => string,
) => {
  const review = report?.reviewReport || {};
  const correctedItems = Array.isArray(review?.correctedItems)
    ? review.correctedItems
    : [];

  const hasReviewSection =
    !!report?.statusReport ||
    !!review?.resolutionNotes ||
    !!review?.finalDecision ||
    (review?.canContinueOperation !== null &&
      review?.canContinueOperation !== undefined) ||
    correctedItems.length > 0;

  if (!hasReviewSection) {
    const hasFaults = Object.values(report?.driverReport?.checklist || {}).some(
      item => !!item?.fault,
    );

    return hasFaults
      ? `<div class="infodot" style="color: red;">${escapeHtml(
          localized('Defects found are sent for validation to the responsible reviewer.'),
        )}</div>`
      : `<div class="infodot">✓ ${escapeHtml(
          localized('CONDITION OF THE ABOVE VEHICLE IS SATISFACTORY'),
        )}</div>`;
  }

  const correctedItemsHtml = correctedItems
    .map(
      item => `
        <tr>
          <td>${escapeHtml(item?.label || '—')}</td>
          <td>${escapeHtml(item?.fault || '—')}</td>
          <td>${escapeHtml(item?.actionTaken || '—')}</td>
          <td>${escapeHtml(item?.typeSolution || '—')}</td>
        </tr>
      `,
    )
    .join('');

  return `
    <div class="header">${escapeHtml(localized('Carrier Review'))}</div>

    <div class="info-row">
      <div class="info-block">${escapeHtml(localized('Reported Status'))}:</div>
      <div class="info-block underline">${escapeHtml(report?.statusReport || '—')}</div>
    </div>

    <div class="info-row">
      <div class="info-block">${escapeHtml(localized('Final Decision'))}:</div>
      <div class="info-block underline">${escapeHtml(review?.finalDecision || '—')}</div>
    </div>

    <div class="info-row">
      <div class="info-block">${escapeHtml(localized('Can Continue Operation'))}:</div>
      <div class="info-block underline">${
        review?.canContinueOperation === true
          ? escapeHtml(localized('Yes'))
          : review?.canContinueOperation === false
            ? escapeHtml(localized('No'))
            : '—'
      }</div>
    </div>

    ${
      review?.resolutionNotes
        ? `
          <div class="info-row">
            <div class="info-block">${escapeHtml(localized('Resolution Notes'))}:</div>
            <div class="info-block underline">${escapeHtml(review.resolutionNotes)}</div>
          </div>
        `
        : ''
    }

    ${
      correctedItemsHtml
        ? `
          <div class="header">${escapeHtml(localized('Corrected Items'))}</div>
          <table style="width: 100%;">
            <thead>
              <tr>
                <th>${escapeHtml(localized('Item'))}</th>
                <th>${escapeHtml(localized('Fault'))}</th>
                <th>${escapeHtml(localized('Action'))}</th>
                <th>${escapeHtml(localized('Type'))}</th>
              </tr>
            </thead>
            <tbody>
              ${correctedItemsHtml}
            </tbody>
          </table>
        `
        : ''
    }
  `;
};

const generateSignaturesHTML = (
  report: InspectionReport,
  localized: (key: string) => string,
) => {
  const driverSignature = report?.driverReport?.signature || '';
  const reviewerSignature = report?.reviewReport?.reviewSignature || '';

  return `
    <div class="signatureContainer">
      <div class="signatureBox">
        ${
          driverSignature
            ? `<img src="${driverSignature}" class="signature" />`
            : `<div class="signature"></div>`
        }
        <div class="signatureLabel">${escapeHtml(localized("Driver's Signature"))}</div>
      </div>

      <div class="signatureBox">
        ${
          reviewerSignature
            ? `<img src="${reviewerSignature}" class="signature" />`
            : `<div class="signature"></div>`
        }
        <div class="signatureLabel">${escapeHtml(localized("Reviewer's Signature"))}</div>
      </div>
    </div>
  `;
};

const buildSingleReportHtml = (
  report: InspectionReport,
  localized: (key: string) => string,
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

  return `
    <div class="reportBlock">
      <div class="header">${escapeHtml(localized("Driver's Vehicle Inspection Report"))}</div>
      <div class="infodot">${escapeHtml(localized('AS REQUIRED BY D.O.T. FEDERAL MOTOR CARRIER SAFETY REGULATIONS'))}</div>

      <div class="main-container">
        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Carrier'))}:</div>
          <div class="info-block underline">${escapeHtml(carrierName)}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Driver'))}:</div>
          <div class="info-block underline">${escapeHtml(driverName || '—')}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Vehicle ID'))}:</div>
          <div class="info-block underline">${escapeHtml(report?.vehicleID || '—')}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Vehicle Type'))}:</div>
          <div class="info-block underline">${escapeHtml(report?.vehicleType || '—')}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Inspection Type'))}:</div>
          <div class="info-block underline">${escapeHtml(report?.inspectionType || '—')}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Inspection Context'))}:</div>
          <div class="info-block underline">${escapeHtml(report?.inspectionContext || '—')}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Inspection ID'))}:</div>
          <div class="info-block underline">${escapeHtml(report?.inspectionID || '—')}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Date'))}:</div>
          <div class="info-block underline">${escapeHtml(safeFormatDate(report?.driverReport?.dateReport))}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Time'))}:</div>
          <div class="info-block underline">${escapeHtml(report?.driverReport?.timeReport || '—')}</div>
        </div>

        <div class="info-row">
          <div class="info-block">${escapeHtml(localized('Odometer Reading'))}:</div>
          <div class="info-block underline">${escapeHtml(report?.driverReport?.miles || '—')}</div>
        </div>
      </div>

      <div class="header">${escapeHtml(localized('Checklist'))}</div>
      ${generateChecklistHTML(checklist)}

      ${generateFaultsHTML(checklist, localized)}
      ${generateReviewSectionHTML(report, localized)}
      ${generateSignaturesHTML(report, localized)}
    </div>
  `;
};

const buildFullHtml = (
  reports: InspectionReport[],
  localized: (key: string) => string,
) => {
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; }
          .header { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: center; }
          .main-container { margin-top: 10px; }
          .info-row {
            border: 1px solid #000;
            padding: 5px;
            margin-top: 5px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
          }
          .info-block {
            flex: 1;
            text-align: left;
            padding: 5px;
            margin-right: 10px;
          }
          .infodot { font-size: 14px; text-align: center; margin-top: 14px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          .signatureContainer { display: flex; justify-content: space-between; margin-top: 30px; gap: 20px; }
          .signatureBox { text-align: center; flex: 1; }
          .signature {
            height: 80px;
            margin-top: 5px;
            border: 1px solid black;
            width: 100%;
            object-fit: contain;
          }
          .signatureLabel { font-size: 12px; margin-top: 6px; }
          .fault { color: red; }
          .underline { text-decoration: underline; }
          .reportBlock { margin-bottom: 24px; }
          .pageBreak { page-break-before: always; }
        </style>
      </head>

      <body>
        ${reports
          .map((report, index) => {
            const content = buildSingleReportHtml(report, localized);
            if (index === 0) return content;
            return `<div class="pageBreak">${content}</div>`;
          })
          .join('')}
      </body>
    </html>
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

const PreviewInspectionScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route?.params || {}) as PreviewInspectionRouteParams;

  const { role = 'driver', returnTo } = params;

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const initialReports = useMemo<InspectionReport[]>(
    () => normalizeReportsInput(params),
    [params],
  );

  const [currentReports, setCurrentReports] = useState<InspectionReport[]>(initialReports);
  const [modalVisible, setModalVisible] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processingPdf, setProcessingPdf] = useState(true);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

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

  useEffect(() => {
    setCurrentReports(initialReports);
  }, [initialReports]);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title:
        role === 'reviewer'
          ? localized('Inspection Review Report')
          : currentReports.length > 1
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
  }, [navigation, localized, theme, appearance, role, currentReports.length]);

  const generatePDF = async (reportsToRender: InspectionReport[]) => {
    try {
      setProcessingPdf(true);

      const html = buildFullHtml(reportsToRender, localized);

      const file = await generatePdfFile(
        html,
        `inspection_preview_${role}_${Date.now()}`,
      );

      const resolvedPath = file?.filePath || null;

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

  useEffect(() => {
    if (!currentReports.length) {
      setPdfUri(null);
      setProcessingPdf(false);
      return;
    }

    generatePDF(currentReports);
  }, [currentReports]);

  const handleSignature = async (sig: string) => {
    try {
      setModalVisible(false);

      if (!currentReports.length) return;

      const updatedReports = currentReports.map(report =>
        role === 'reviewer'
          ? {
              ...report,
              reviewReport: {
                ...(report?.reviewReport || {}),
                reviewSignature: sig,
              },
            }
          : {
              ...report,
              driverReport: {
                ...(report?.driverReport || {}),
                signature: sig,
              },
            },
      );

      setCurrentReports(updatedReports);
    } catch (error) {
      console.error('❌ Error saving signature:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not save signature'),
      );
    }
  };

  const attachInspectionLocationIfMissing = async (
    reports: InspectionReport[],
  ) => {
    const needsLocation = reports.some(report => !report?.inspectionLocation);

    if (!needsLocation) {
      return reports;
    }

    const inspectionLocation = await getCurrentPositionAsync();

    return reports.map(report => ({
      ...report,
      inspectionLocation: report?.inspectionLocation || inspectionLocation,
    }));
  };

  const handleSubmit = async () => {
    if (!pdfUri || !currentReports.length) {
      Alert.alert(
        localized('Error'),
        localized('Missing signed inspection data'),
      );
      return;
    }

    const missingSignature =
      role === 'reviewer'
        ? currentReports.some(report => !report?.reviewReport?.reviewSignature)
        : currentReports.some(report => !report?.driverReport?.signature);

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

      const reportsWithLocation = await attachInspectionLocationIfMissing(
        currentReports,
      );

      setCurrentReports(reportsWithLocation);

      const reportsToUpload = reportsWithLocation.map(report =>
        role === 'reviewer'
          ? {
              ...report,
              statusReport: report?.statusReport || 'under_review',
            }
          : {
              ...report,
              statusReport: 'driver_submitted',
            },
      );

      const netState = await NetInfo.fetch();
      const isOnline = !!netState.isConnected && !!netState.isInternetReachable;

      if (isOnline) {
        for (const report of reportsToUpload) {
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
        for (const report of reportsToUpload) {
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
          : currentReports.length > 1
            ? localized('Inspection reports uploaded successfully')
            : localized('Inspection report uploaded successfully'),
      );

      if (returnTo === "carrier" || role === "reviewer") {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: "CarrierInspectionTab",
                state: {
                  routes: [{ name: "inspections" }],
                },
              },
            ],
          }),
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "DriverEntry" }],
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
    if (!currentReports.length) return null;

    return (
      <View style={styles.reportsSummaryBox}>
        <Text style={styles.reportsSummaryTitle}>
          {currentReports.length > 1
            ? localized('Reports Ready to Submit')
            : localized('Report Ready to Submit')}
        </Text>

        {currentReports.map(report => (
          <View key={report.inspectionID} style={styles.reportSummaryRow}>
            <Text style={styles.reportSummaryVehicle}>
              {report?.vehicleType}: {report?.vehicleID}
            </Text>
            <Text style={styles.reportSummaryMeta}>
              {localized('Inspection ID')}: {report?.inspectionID}
            </Text>
            <Text style={styles.reportSummaryMeta}>
              {localized('Type')}: {report?.inspectionType || '—'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const signatureReady =
    role === 'reviewer'
      ? currentReports.length > 0 &&
        currentReports.every(report => !!report?.reviewReport?.reviewSignature)
      : currentReports.length > 0 &&
        currentReports.every(report => !!report?.driverReport?.signature);

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

        {signatureReady && pdfUri ? (
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