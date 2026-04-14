import { useMemo, useState } from 'react';
import { Alert } from 'react-native';

type FaultItem = {
  label: string;
  fault: string;
};

type ChecklistItem = {
  isChecked?: boolean;
  label?: string;
  fault?: string;
  vehicleType?: 'Truck' | 'Trailer';
};

type InspectionReport = {
  vehicleID?: string;
  vehicleType?: 'Truck' | 'Trailer';
  driver?: any;
  inspectionType?: 'pretrip' | 'posttrip';
  inspectionContext?: 'job' | 'standalone';
  driverReport?: {
    checklist?: Record<string, ChecklistItem>;
    miles?: string;
    dateReport?: string | null;
    timeReport?: string;
    signature?: string;
    signatureURL?: string;
  };
  [key: string]: any;
};

type Params = {
  reports: InspectionReport[];
  navigation: any;
  localized: (key: string) => string;
  onSignatureSaved?: () => void;
};

const useSummaryInspection = ({
  reports,
  navigation,
  localized,
  onSignatureSaved,
}: Params) => {
  const [signature, setSignature] = useState<string | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

  const primaryReport = reports?.[0] || null;

  const allChecklistItems = useMemo<ChecklistItem[]>(() => {
    return reports.flatMap(report =>
      Object.values(report?.driverReport?.checklist || {}) as ChecklistItem[],
    );
  }, [reports]);

  const truckItems = useMemo(
    () => allChecklistItems.filter(item => item?.vehicleType === 'Truck'),
    [allChecklistItems],
  );

  const trailerItems = useMemo(
    () => allChecklistItems.filter(item => item?.vehicleType === 'Trailer'),
    [allChecklistItems],
  );

  const countCheckedItems = (items: ChecklistItem[]) =>
    items.filter(item => !!item?.isChecked).length;

  const countFaults = (items: ChecklistItem[]) =>
    items.filter(item => !!item?.fault).length;

  const listFaultDescriptions = (items: ChecklistItem[]): FaultItem[] =>
    items
      .filter(item => !!item?.fault)
      .map(item => ({
        label: item?.label || '',
        fault: item?.fault || '',
      }));

  const truckCheckedCount = useMemo(
    () => countCheckedItems(truckItems),
    [truckItems],
  );

  const trailerCheckedCount = useMemo(
    () => countCheckedItems(trailerItems),
    [trailerItems],
  );

  const truckFaultsCount = useMemo(
    () => countFaults(truckItems),
    [truckItems],
  );

  const trailerFaultsCount = useMemo(
    () => countFaults(trailerItems),
    [trailerItems],
  );

  const truckFaultsList = useMemo(
    () => listFaultDescriptions(truckItems),
    [truckItems],
  );

  const trailerFaultsList = useMemo(
    () => listFaultDescriptions(trailerItems),
    [trailerItems],
  );

  const firstTruckName = useMemo(() => {
    const truckReport = reports.find(report => report?.vehicleType === 'Truck');
    return truckReport?.vehicleID || null;
  }, [reports]);

  const firstTrailerName = useMemo(() => {
    const trailerReport = reports.find(
      report => report?.vehicleType === 'Trailer',
    );
    return trailerReport?.vehicleID || null;
  }, [reports]);

  const handleSignature = (value: string) => {
    setSignature(value);
    onSignatureSaved?.();
  };

  const handleConfirm = async (payloadOverride?: any) => {
    try {
      const finalPayload =
        payloadOverride ||
        (primaryReport
          ? {
              ...primaryReport,
              driverReport: {
                ...(primaryReport?.driverReport || {}),
                signature,
                signatureURL: signature,
              },
            }
          : null);

      const finalSignature =
        finalPayload?.driverReport?.signature ||
        finalPayload?.driverReport?.signatureURL ||
        signature;

      if (!finalSignature) {
        Alert.alert(localized('Error'), localized('sign required'));
        return;
      }

      navigation.navigate('PreviewInspection', {
        reportData: finalPayload,
        role: 'driver',
      });
    } catch (error: any) {
      console.error('Error sending report:', error);
      Alert.alert(
        localized('Error'),
        error?.message || localized('Error Sending the report'),
      );
    }
  };

  const handleGenerateAndShowPDF = async (payloadOverride?: any) => {
    try {
      const finalPayload =
        payloadOverride ||
        (primaryReport
          ? {
              ...primaryReport,
              driverReport: {
                ...(primaryReport?.driverReport || {}),
                signature: signature || primaryReport?.driverReport?.signature || '',
                signatureURL:
                  signature || primaryReport?.driverReport?.signatureURL || '',
              },
            }
          : null);

      navigation.navigate('PreviewInspection', {
        reportData: finalPayload,
        role: 'driver',
      });

      setPdfUri('generated');
    } catch (error) {
      console.error('Error generating preview:', error);
    }
  };

  return {
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
  };
};

export default useSummaryInspection;