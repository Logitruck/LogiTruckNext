import { useCallback } from 'react';
import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

import { db } from '../../../core/firebase/config';

const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  return blob;
};

const useInspectionReportMutations = () => {
  const uploadPDF = useCallback(
    async (pdfPath: string, inspectionID: string) => {
      if (!pdfPath || !inspectionID) {
        throw new Error('Missing pdfPath or inspectionID');
      }

      try {
        const storage = getStorage();
        const storageRef = ref(storage, `inspection_reports/${inspectionID}.pdf`);

        const blob = await uriToBlob(pdfPath);
        await uploadBytes(storageRef, blob);

        const downloadURL = await getDownloadURL(storageRef);
        return downloadURL;
      } catch (error: any) {
        console.error('❌ Error uploading inspection PDF:', error);
        throw new Error(
          error?.message || 'Failed to upload inspection PDF.',
        );
      }
    },
    [],
  );

  const saveInspectionReport = useCallback(
    async (reportData: any, currentUser: any) => {
      try {
        const inspectionID = reportData?.inspectionID;
        const vendorID = reportData?.vendorID;
        const truckID = reportData?.truckID;
        const trailerID = reportData?.trailerID;
        const dispatcherID =
          currentUser?.id ||
          currentUser?.userID ||
          reportData?.dispatchCarrier?.id ||
          '';

        if (!inspectionID) {
          throw new Error('Missing inspectionID');
        }

        if (!vendorID) {
          throw new Error('Missing vendorID');
        }

        if (!dispatcherID) {
          throw new Error('Missing dispatcherID');
        }

        const cleanReportData = JSON.parse(JSON.stringify(reportData));

        const payload = {
          ...cleanReportData,
          updatedAt: serverTimestamp(),
          updatedBy: {
            uid: currentUser?.id || currentUser?.userID || '',
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
            email: currentUser?.email || '',
            role: 'dispatcher',
          },
        };

        // 1. Guardar en carrier_inspections
        const carrierInspectionRef = doc(
          db,
          'carrier_inspections',
          vendorID,
          'dispatchers',
          dispatcherID,
          'inspections',
          inspectionID,
        );

        await setDoc(
          carrierInspectionRef,
          {
            ...payload,
            createdAt: serverTimestamp(),
          },
          { merge: true },
        );

        // 2. Guardar en truck inspections
        if (truckID) {
          const truckInspectionRef = doc(
            db,
            'vendor_vehicles',
            vendorID,
            'vehicles',
            truckID,
            'inspections',
            inspectionID,
          );

          await setDoc(
            truckInspectionRef,
            {
              ...payload,
              vehicleID: truckID,
              vehicleType: 'Truck',
              createdAt: serverTimestamp(),
            },
            { merge: true },
          );

          const truckVehicleRef = doc(
            db,
            'vendor_vehicles',
            vendorID,
            'vehicles',
            truckID,
          );

          await setDoc(
            truckVehicleRef,
            {
              lastInspectionPDF: reportData?.pdfURL || null,
              lastReportDate: serverTimestamp(),
              lastInspectionReportId: inspectionID,
              statusReport: reportData?.statusReport || 'Pending',
            },
            { merge: true },
          );
        }

        // 3. Guardar en trailer inspections
        if (trailerID) {
          const trailerInspectionRef = doc(
            db,
            'vendor_vehicles',
            vendorID,
            'vehicles',
            trailerID,
            'inspections',
            inspectionID,
          );

          await setDoc(
            trailerInspectionRef,
            {
              ...payload,
              vehicleID: trailerID,
              vehicleType: 'Trailer',
              createdAt: serverTimestamp(),
            },
            { merge: true },
          );

          const trailerVehicleRef = doc(
            db,
            'vendor_vehicles',
            vendorID,
            'vehicles',
            trailerID,
          );

          await setDoc(
            trailerVehicleRef,
            {
              lastInspectionPDF: reportData?.pdfURL || null,
              lastReportDate: serverTimestamp(),
              lastInspectionReportId: inspectionID,
              statusReport: reportData?.statusReport || 'Pending',
            },
            { merge: true },
          );
        }

        return inspectionID;
      } catch (error: any) {
        console.error('❌ Error saving inspection report:', error);
        throw new Error(
          error?.message || 'Failed to save inspection report.',
        );
      }
    },
    [],
  );

  return {
    uploadPDF,
    saveInspectionReport,
  };
};

export default useInspectionReportMutations;