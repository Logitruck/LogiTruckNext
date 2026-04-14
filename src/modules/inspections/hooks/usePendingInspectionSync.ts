import { useCallback, useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';

import useUploadSignedInspectionReport from './useUploadSignedInspectionReport';
import {
  getPendingInspectionReports,
  removePendingInspectionReport,
  PendingInspectionReport,
  PendingInspectionReportData,
} from '../services/inspectionStorageService';

type InspectionReportData = {
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

const isValidInspectionReport = (
  data: PendingInspectionReportData | null | undefined,
): data is InspectionReportData => {
  return !!(
    data &&
    typeof data.inspectionID === 'string' &&
    data.inspectionID.trim().length > 0 &&
    typeof data.reportID === 'string' &&
    data.reportID.trim().length > 0 &&
    typeof data.vehicleID === 'string' &&
    data.vehicleID.trim().length > 0 &&
    (data.vehicleType === 'Truck' || data.vehicleType === 'Trailer') &&
    data.driverReport &&
    typeof data.driverReport === 'object'
  );
};

const usePendingInspectionSync = (
  localized: (key: string) => string,
) => {
  const syncingRef = useRef(false);
  const { upload } = useUploadSignedInspectionReport(localized);

  const syncPendingReports = useCallback(async () => {
    if (syncingRef.current) {
      return;
    }

    syncingRef.current = true;

    try {
      const pendingReports = await getPendingInspectionReports();

      if (!pendingReports.length) {
        return;
      }

      const sortedReports = [...pendingReports].sort(
        (a: PendingInspectionReport, b: PendingInspectionReport) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateA - dateB;
        },
      );

      for (const item of sortedReports) {
        try {
          const reportData = item.reportData;

          if (!isValidInspectionReport(reportData)) {
            console.warn(
              `⚠️ Skipping invalid pending inspection report ${item.id}`,
              reportData,
            );
            continue;
          }

          if (!item.pdfUri || !item.signatureDataUrl) {
            console.warn(
              `⚠️ Skipping incomplete pending inspection assets ${item.id}`,
            );
            continue;
          }

          await upload(
            reportData,
            item.role,
            item.pdfUri,
            item.signatureDataUrl,
            {
              navigateOnSuccess: false,
              showAlerts: false,
            },
          );

          await removePendingInspectionReport(item.id);
        } catch (error) {
          console.error(
            `❌ Error syncing pending inspection report ${item.id}:`,
            error,
          );
        }
      }
    } finally {
      syncingRef.current = false;
    }
  }, [upload]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = !!state.isConnected && !!state.isInternetReachable;

      if (isConnected) {
        syncPendingReports();
      }
    });

    syncPendingReports();

    return unsubscribe;
  }, [syncPendingReports]);

  return {
    syncPendingReports,
  };
};

export default usePendingInspectionSync;