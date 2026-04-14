import { Alert } from 'react-native';
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

import { auth, db } from '../../../core/firebase/config';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';

type LocalizedFn = (key: string) => string;
type UploadRole = 'driver' | 'reviewer';

type UploadOptions = {
  navigateOnSuccess?: boolean;
  showAlerts?: boolean;
};

type DriverChecklistItem = {
  isChecked: boolean;
  label: string;
  fault: string;
  vehicleType?: 'Truck' | 'Trailer';
};

type InspectionReportData = {
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
    checklist: Record<string, DriverChecklistItem>;
    miles?: string;
    dateReport?: string | null;
    timeReport?: string;
    signature?: string;
    signatureURL?: string;
    signedAt?: any;
    signedBy?: any;
  };
  reviewReport?: {
    reviewedBy?: any;
    reviewedAt?: any;
    reviewSignature?: string;
    reviewSignatureURL?: string;
    resolutionNotes?: string;
    correctedItems?: any[];
    finalDecision?: string | null;
    canContinueOperation?: boolean | null;
  };
  statusReport?: string;
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return await response.blob();
};

const fileUriToBlob = async (fileUri: string) => {
  const response = await fetch(fileUri);
  return await response.blob();
};

const normalizeReviewStatus = (
  reviewReport: InspectionReportData['reviewReport'],
  role: UploadRole,
) => {
  if (role === 'driver') {
    return 'driver_submitted';
  }

  const finalDecision = reviewReport?.finalDecision ?? null;

  if (finalDecision === 'approved') {
    return 'approved_for_operation';
  }

  if (finalDecision === 'blocked') {
    return 'blocked_for_operation';
  }

  return 'under_review';
};

const buildVehicleInspectionDoc = ({
  reportData,
  vendorID,
  driverReport,
  reviewReport,
  statusReport,
  pdfURL,
}: {
  reportData: InspectionReportData;
  vendorID: string;
  driverReport: InspectionReportData['driverReport'];
  reviewReport: InspectionReportData['reviewReport'];
  statusReport: string;
  pdfURL: string;
}) => {
  return {
    inspectionID: reportData.inspectionID,
    reportID: reportData.reportID,
    vendorID,

    vehicleID: reportData.vehicleID,
    vehicleType: reportData.vehicleType,

    inspectionType: reportData.inspectionType || null,
    inspectionContext: reportData.inspectionContext || null,
    inspectionLocation: reportData.inspectionLocation || null,
    operationContext: reportData.operationContext || null,

    jobID: reportData.jobID || null,
    projectID: reportData.projectID || null,
    channelID: reportData.channelID || null,

    driver: reportData.driver || null,
    dispatchCarrier: reportData.dispatchCarrier || null,
    carrier: reportData.carrier || null,

    driverReport,
    reviewReport: reviewReport || null,

    statusReport,
    pdfURL,

    updatedAt: serverTimestamp(),
  };
};

const buildInspectionSummary = ({
  reportData,
  statusReport,
  pdfURL,
  driverReport,
  reviewReport,
}: {
  reportData: InspectionReportData;
  statusReport: string;
  pdfURL: string;
  driverReport: InspectionReportData['driverReport'];
  reviewReport: InspectionReportData['reviewReport'];
}) => {
  return {
    inspectionID: reportData.inspectionID,
    reportID: reportData.reportID,
    statusReport,
    lastReportDate: serverTimestamp(),
    pdfURL,
    canContinueOperation: reviewReport?.canContinueOperation ?? null,
    lastDriverID:
      reportData?.driver?.id ||
      reportData?.driver?.userID ||
      driverReport?.signedBy?.userID ||
      null,
    reviewedAt: reviewReport?.reviewedAt || null,
    vehicleType: reportData.vehicleType,
    inspectionType: reportData.inspectionType || null,
    inspectionContext: reportData.inspectionContext || null,
    inspectionLocation: reportData.inspectionLocation || null,
  };
};

const buildJobInspectionSnapshot = ({
  reportData,
  statusReport,
  pdfURL,
  reviewReport,
}: {
  reportData: InspectionReportData;
  statusReport: string;
  pdfURL: string;
  reviewReport: InspectionReportData['reviewReport'];
}) => {
  return {
    inspectionID: reportData.inspectionID,
    reportID: reportData.reportID,
    vehicleID: reportData.vehicleID,
    vehicleType: reportData.vehicleType,
    statusReport,
    lastReportDate: serverTimestamp(),
    pdfURL,
    canContinueOperation: reviewReport?.canContinueOperation ?? null,
    inspectionType: reportData.inspectionType || null,
    inspectionContext: reportData.inspectionContext || null,
  };
};

const getJobInspectionField = (vehicleType: 'Truck' | 'Trailer') => {
  return vehicleType === 'Truck' ? 'truckInspection' : 'trailerInspection';
};

const useUploadSignedInspectionReport = (
  localized: LocalizedFn,
  navigation?: any,
) => {
  const currentUser = useCurrentUser();

  const upload = async (
    reportData: InspectionReportData,
    role: UploadRole,
    pdfUri: string,
    signatureDataUrl: string,
    options: UploadOptions = {},
  ) => {
    const { navigateOnSuccess = true, showAlerts = true } = options;

    try {
      const authUser = auth.currentUser;

      if (!authUser?.uid) {
        throw new Error('User not authenticated');
      }

      const vendorID =
        currentUser?.activeVendorID ||
        currentUser?.vendorID ||
        reportData?.carrier?.id ||
        reportData?.vendorID ||
        null;

      if (!vendorID) {
        throw new Error('Missing vendorID');
      }

      if (!reportData?.inspectionID || !reportData?.reportID) {
        throw new Error('Missing inspection identifiers');
      }

      if (!reportData?.vehicleID || !reportData?.vehicleType) {
        throw new Error('Missing vehicle information');
      }

      if (!pdfUri) {
        throw new Error('Missing PDF file');
      }

      if (!signatureDataUrl) {
        throw new Error('Missing signature');
      }

      const inspectionID = reportData.inspectionID;

      const signedBy = {
        userID: currentUser?.id || currentUser?.userID || authUser.uid,
        vendorID,
        email: currentUser?.email || authUser.email || '',
        firstName: currentUser?.firstName || '',
        lastName: currentUser?.lastName || '',
        role,
      };

      const storage = getStorage();

      let driverSignatureURL = reportData?.driverReport?.signatureURL || '';
      let reviewSignatureURL =
        reportData?.reviewReport?.reviewSignatureURL || '';

      if (role === 'driver') {
        const driverSignatureBlob = await dataUrlToBlob(signatureDataUrl);
        const driverSignatureRef = ref(
          storage,
          `inspection_reports/${inspectionID}/driver_signature.png`,
        );

        await uploadBytes(driverSignatureRef, driverSignatureBlob, {
          contentType: 'image/png',
        });

        driverSignatureURL = await getDownloadURL(driverSignatureRef);
      }

      if (role === 'reviewer') {
        const reviewSignatureBlob = await dataUrlToBlob(signatureDataUrl);
        const reviewSignatureRef = ref(
          storage,
          `inspection_reports/${inspectionID}/review_signature.png`,
        );

        await uploadBytes(reviewSignatureRef, reviewSignatureBlob, {
          contentType: 'image/png',
        });

        reviewSignatureURL = await getDownloadURL(reviewSignatureRef);
      }

      const pdfBlob = await fileUriToBlob(pdfUri);
      const pdfRef = ref(
        storage,
        `inspection_reports/${inspectionID}/inspection_report.pdf`,
      );

      await uploadBytes(pdfRef, pdfBlob, {
        contentType: 'application/pdf',
      });

      const pdfURL = await getDownloadURL(pdfRef);

      const driverReport = {
        ...(reportData?.driverReport || {}),
        checklist: reportData?.driverReport?.checklist || {},
        miles: reportData?.driverReport?.miles || '',
        dateReport: reportData?.driverReport?.dateReport || null,
        timeReport: reportData?.driverReport?.timeReport || '',
        signature:
          role === 'driver'
            ? signatureDataUrl
            : reportData?.driverReport?.signature || '',
        signatureURL:
          role === 'driver'
            ? driverSignatureURL
            : reportData?.driverReport?.signatureURL || '',
        signedAt:
          role === 'driver'
            ? serverTimestamp()
            : reportData?.driverReport?.signedAt || null,
        signedBy:
          role === 'driver'
            ? signedBy
            : reportData?.driverReport?.signedBy || null,
      };

      const reviewReport = {
        ...(reportData?.reviewReport || {}),
        reviewedBy:
          role === 'reviewer'
            ? signedBy
            : reportData?.reviewReport?.reviewedBy || null,
        reviewedAt:
          role === 'reviewer'
            ? serverTimestamp()
            : reportData?.reviewReport?.reviewedAt || null,
        reviewSignature:
          role === 'reviewer'
            ? signatureDataUrl
            : reportData?.reviewReport?.reviewSignature || '',
        reviewSignatureURL:
          role === 'reviewer'
            ? reviewSignatureURL
            : reportData?.reviewReport?.reviewSignatureURL || '',
        resolutionNotes: reportData?.reviewReport?.resolutionNotes || '',
        correctedItems: Array.isArray(reportData?.reviewReport?.correctedItems)
          ? reportData.reviewReport.correctedItems
          : [],
        finalDecision: reportData?.reviewReport?.finalDecision ?? null,
        canContinueOperation:
          reportData?.reviewReport?.canContinueOperation ?? null,
      };

      const statusReport = normalizeReviewStatus(reviewReport, role);

      const writes: Promise<any>[] = [];

      const vehicleInspectionRef = doc(
        db,
        'vendor_vehicles',
        vendorID,
        'vehicles',
        reportData.vehicleID,
        'inspections',
        inspectionID,
      );

      const vehicleDoc = buildVehicleInspectionDoc({
        reportData,
        vendorID,
        driverReport,
        reviewReport,
        statusReport,
        pdfURL,
      });

      writes.push(
        setDoc(
          vehicleInspectionRef,
          {
            ...vehicleDoc,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        ),
      );

      const vehicleRef = doc(
        db,
        'vendor_vehicles',
        vendorID,
        'vehicles',
        reportData.vehicleID,
      );

      const inspectionSummary = buildInspectionSummary({
        reportData,
        statusReport,
        pdfURL,
        driverReport,
        reviewReport,
      });

      const vehiclePayload: any = {
        inspectionSummary,
        updatedAt: serverTimestamp(),
        lastInspectionStatus: statusReport,
        lastInspectionDate: serverTimestamp(),
        lastInspectionPDF: pdfURL,
        lastInspectionType: reportData?.inspectionType || null,
        lastInspectionContext: reportData?.inspectionContext || null,
      };

      if (
        reportData?.inspectionLocation?.latitude &&
        reportData?.inspectionLocation?.longitude
      ) {
        vehiclePayload.currentLocation = {
          latitude: reportData.inspectionLocation.latitude,
          longitude: reportData.inspectionLocation.longitude,
        };

        vehiclePayload.lastInspectionLocation = {
          latitude: reportData.inspectionLocation.latitude,
          longitude: reportData.inspectionLocation.longitude,
        };

        vehiclePayload.lastUpdatedAt = serverTimestamp();
      }

      if (
        reportData?.inspectionType === 'pretrip' &&
        statusReport === 'approved_for_operation'
      ) {
        vehiclePayload.operationSessionOpen = true;
        vehiclePayload.requiresPretrip = false;
        vehiclePayload.requiresPosttrip = true;
      }

      if (reportData?.inspectionType === 'posttrip') {
        vehiclePayload.operationSessionOpen = false;
        vehiclePayload.requiresPretrip = true;
        vehiclePayload.requiresPosttrip = false;
      }

      writes.push(
        setDoc(vehicleRef, vehiclePayload, { merge: true }),
      );

      if (reportData?.channelID && reportData?.projectID && reportData?.jobID) {
        const jobRef = doc(
          db,
          'project_channels',
          reportData.channelID,
          'projects',
          reportData.projectID,
          'jobs',
          reportData.jobID,
        );

        const jobInspectionField = getJobInspectionField(reportData.vehicleType);
        const jobInspectionSnapshot = buildJobInspectionSnapshot({
          reportData,
          statusReport,
          pdfURL,
          reviewReport,
        });

        writes.push(
          updateDoc(jobRef, {
            [jobInspectionField]: jobInspectionSnapshot,
            updatedAt: serverTimestamp(),
          }),
        );
      }

      await Promise.all(writes);

      if (showAlerts) {
        Alert.alert(
          localized('Success'),
          role === 'driver'
            ? localized('Inspection report uploaded successfully')
            : localized('Inspection review uploaded successfully'),
        );
      }

      if (navigateOnSuccess && navigation) {
        navigation.navigate('DriverHomeTab');
      }

      return {
        inspectionID,
        reportID: reportData.reportID,
        statusReport,
        pdfURL,
        driverSignatureURL,
        reviewSignatureURL,
      };
    } catch (error) {
      console.error('❌ Error uploading inspection report:', error);

      if (showAlerts) {
        Alert.alert(
          localized('Error'),
          localized('Failed to upload signed inspection report'),
        );
      }

      throw error;
    }
  };

  return { upload };
};

export default useUploadSignedInspectionReport;