import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_INSPECTION_REPORTS_KEY = '@pending_inspection_reports_v2';

export type PendingInspectionRole = 'driver' | 'reviewer';

export type PendingInspectionReportData = {
  inspectionID?: string;
  reportID?: string;
  vendorID?: string | null;
  vehicleID?: string;
  vehicleType?: 'Truck' | 'Trailer';
  statusReport?: string;
  jobID?: string | null;
  projectID?: string | null;
  channelID?: string | null;
  driverReport?: {
    signature?: string;
    signatureURL?: string;
    miles?: string;
    dateReport?: string | null;
    timeReport?: string;
    [key: string]: any;
  };
  reviewReport?: {
    reviewSignature?: string;
    reviewSignatureURL?: string;
    finalDecision?: string | null;
    canContinueOperation?: boolean | null;
    [key: string]: any;
  };
  [key: string]: any;
};

export type PendingInspectionReport = {
  id: string;
  role: PendingInspectionRole;
  reportData: PendingInspectionReportData;
  pdfUri: string;
  signatureDataUrl: string;
  createdAt: string;
};

const readAll = async (): Promise<PendingInspectionReport[]> => {
  try {
    const raw = await AsyncStorage.getItem(PENDING_INSPECTION_REPORTS_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('❌ Error reading pending inspection reports:', error);
    return [];
  }
};

const writeAll = async (items: PendingInspectionReport[]) => {
  try {
    await AsyncStorage.setItem(
      PENDING_INSPECTION_REPORTS_KEY,
      JSON.stringify(items),
    );
  } catch (error) {
    console.error('❌ Error writing pending inspection reports:', error);
    throw error;
  }
};

const buildPendingId = (
  inspectionID?: string,
  role?: PendingInspectionRole,
  fallbackId?: string,
) => {
  const resolvedBase = inspectionID || fallbackId || 'unknown_inspection';
  const resolvedRole = role || 'driver';
  return `${resolvedBase}_${resolvedRole}`;
};

export const getPendingInspectionReports = async () => {
  return await readAll();
};

export const getPendingInspectionReportsByRole = async (
  role: PendingInspectionRole,
) => {
  const currentItems = await readAll();
  return currentItems.filter(item => item.role === role);
};

export const getPendingInspectionReportById = async (id: string) => {
  const currentItems = await readAll();
  return currentItems.find(item => item.id === id) || null;
};

export const savePendingInspectionReport = async (
  report: Omit<PendingInspectionReport, 'createdAt' | 'id'> & {
    id?: string;
  },
) => {
  const currentItems = await readAll();

  const resolvedId =
    report.id ||
    buildPendingId(
      report.reportData?.inspectionID,
      report.role,
      report.reportData?.reportID,
    );

  const filteredItems = currentItems.filter(item => item.id !== resolvedId);

  const newItem: PendingInspectionReport = {
    ...report,
    id: resolvedId,
    createdAt: new Date().toISOString(),
  };

  await writeAll([newItem, ...filteredItems]);

  return newItem;
};

export const removePendingInspectionReport = async (id: string) => {
  const currentItems = await readAll();
  const updatedItems = currentItems.filter(item => item.id !== id);
  await writeAll(updatedItems);
};

export const removePendingInspectionReportsByInspection = async (
  inspectionID: string,
) => {
  const currentItems = await readAll();
  const updatedItems = currentItems.filter(
    item => item.reportData?.inspectionID !== inspectionID,
  );
  await writeAll(updatedItems);
};

export const removePendingInspectionReportsByVehicle = async (
  vehicleID: string,
) => {
  const currentItems = await readAll();
  const updatedItems = currentItems.filter(
    item => item.reportData?.vehicleID !== vehicleID,
  );
  await writeAll(updatedItems);
};

export const clearPendingInspectionReports = async () => {
  await AsyncStorage.removeItem(PENDING_INSPECTION_REPORTS_KEY);
};

export const replacePendingInspectionReport = async (
  id: string,
  updater: (current: PendingInspectionReport) => PendingInspectionReport,
) => {
  const currentItems = await readAll();

  const updatedItems = currentItems.map(item => {
    if (item.id !== id) {
      return item;
    }

    return updater(item);
  });

  await writeAll(updatedItems);
};

export const hasPendingInspectionReports = async () => {
  const currentItems = await readAll();
  return currentItems.length > 0;
};