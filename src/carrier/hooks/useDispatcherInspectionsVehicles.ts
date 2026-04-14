import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import { db } from '../../core/firebase/config';

type InspectionVehicleType = 'Truck' | 'Trailer';

type RawInspectionDoc = {
  id: string;
  inspectionID?: string;
  truckID?: string;
  trailerID?: string;
  dateReport?: any;
  statusReport?: string;
  pdfURL?: string | null;
  [key: string]: any;
};

type VendorVehicleDoc = {
  vehicleID?: string;
  name?: string;
  [key: string]: any;
};

export type DispatcherInspectionVehicle = {
  id: string;
  vehicleID: string;
  name: string;
  type: InspectionVehicleType;
  lastReportDate: Date | null;
  statusReport: string;
  lastInspectionPDF: string | null;
  isValid: boolean;
  fullInspectionData: RawInspectionDoc;
};

const normalizeDate = (value: any): Date | null => {
  if (!value) return null;

  if (value?.toDate) {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted
      : null;
  }

  if (value?.seconds) {
    const converted = new Date(value.seconds * 1000);
    return !Number.isNaN(converted.getTime()) ? converted : null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameCalendarDay = (date: Date | null) => {
  if (!date) return false;

  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

const useDispatcherInspectionsVehicles = (
  vendorID?: string,
  dispatchID?: string,
) => {
  const [vehicles, setVehicles] = useState<DispatcherInspectionVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorID || !dispatchID) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const inspectionsRef = collection(
      db,
      'carrier_inspections',
      vendorID,
      'dispatchers',
      dispatchID,
      'inspections',
    );

    const inspectionsQuery = query(inspectionsRef);

    const unsubscribe = onSnapshot(
      inspectionsQuery,
      async (snapshot) => {
        try {
          const rawDocs: RawInspectionDoc[] = snapshot.docs.map((itemDoc) => ({
            id: itemDoc.id,
            ...itemDoc.data(),
          }));

          const latestInspectionsMap = new Map<
            string,
            {
              doc: RawInspectionDoc;
              date: Date | null;
              type: InspectionVehicleType;
            }
          >();

          rawDocs.forEach((inspectionDoc) => {
            const reportDate = normalizeDate(inspectionDoc.dateReport);

            if (inspectionDoc.truckID) {
              const previous = latestInspectionsMap.get(inspectionDoc.truckID);

              if (
                !previous ||
                ((reportDate?.getTime() || 0) > (previous.date?.getTime() || 0))
              ) {
                latestInspectionsMap.set(inspectionDoc.truckID, {
                  doc: inspectionDoc,
                  date: reportDate,
                  type: 'Truck',
                });
              }
            }

            if (inspectionDoc.trailerID) {
              const previous = latestInspectionsMap.get(inspectionDoc.trailerID);

              if (
                !previous ||
                ((reportDate?.getTime() || 0) > (previous.date?.getTime() || 0))
              ) {
                latestInspectionsMap.set(inspectionDoc.trailerID, {
                  doc: inspectionDoc,
                  date: reportDate,
                  type: 'Trailer',
                });
              }
            }
          });

          const vehicleIDs = Array.from(latestInspectionsMap.keys());
          let vehicleDataMap: Record<string, VendorVehicleDoc> = {};

          if (vehicleIDs.length > 0) {
            const chunks: string[][] = [];
            for (let index = 0; index < vehicleIDs.length; index += 10) {
              chunks.push(vehicleIDs.slice(index, index + 10));
            }

            for (const chunk of chunks) {
              const vehiclesRef = collection(
                db,
                'vendor_vehicles',
                vendorID,
                'vehicles',
              );

              const vehiclesQuery = query(
                vehiclesRef,
                where('vehicleID', 'in', chunk),
              );

              const vehiclesSnap = await getDocs(vehiclesQuery);

              vehiclesSnap.docs.forEach((vehicleDoc) => {
                const data = vehicleDoc.data() as VendorVehicleDoc;
                const key = data?.vehicleID;

                if (key) {
                  vehicleDataMap[key] = data;
                }
              });
            }
          }

          const vehiclesData: DispatcherInspectionVehicle[] = [];

          latestInspectionsMap.forEach(({ doc, date, type }, vehicleID) => {
            const vehicle = vehicleDataMap[vehicleID];

            vehiclesData.push({
              id: `${doc.inspectionID || doc.id}_${type.toLowerCase()}`,
              vehicleID,
              name: vehicle?.name || type,
              type,
              lastReportDate: date,
              statusReport: doc.statusReport || 'N/A',
              lastInspectionPDF: doc.pdfURL || null,
              isValid:
                ['Approved', 'Approved by Mechanics'].includes(
                  doc.statusReport || '',
                ) && isSameCalendarDay(date),
              fullInspectionData: doc,
            });
          });

          vehiclesData.sort((a, b) => {
            const aTime = a.lastReportDate?.getTime() || 0;
            const bTime = b.lastReportDate?.getTime() || 0;
            return bTime - aTime;
          });

          setVehicles(vehiclesData);
          setLoading(false);
        } catch (error) {
          console.error(
            '🚨 Error processing dispatcher inspections vehicles:',
            error,
          );
          setVehicles([]);
          setLoading(false);
        }
      },
      (error) => {
        console.error(
          '🚨 Error fetching inspections from carrier_inspections:',
          error,
        );
        setVehicles([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorID, dispatchID]);

  return {
    vehicles,
    loading,
  };
};

export default useDispatcherInspectionsVehicles;