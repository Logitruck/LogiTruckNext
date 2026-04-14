import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
} from 'firebase/firestore';

import { db } from '../../../core/firebase/config';

export type VehicleInspectionSummary = {
  inspectionID?: string;
  reportID?: string;
  statusReport?: string | null;
  lastReportDate?: any;
  pdfURL?: string | null;
  canContinueOperation?: boolean | null;
  lastDriverID?: string | null;
  reviewedAt?: any;
  vehicleType?: 'Truck' | 'Trailer' | string;
  [key: string]: any;
};

export type CarrierInspectionVehicle = {
  id: string;
  vehicleID: string;
  vendorID: string;
  name?: string;
  number?: string;
  type?: 'Truck' | 'Trailer' | string;
  currentAssignedDriverID?: string | null;
  assignedDriverID?: string | null;
  inspectionSummary?: VehicleInspectionSummary | null;

  statusReport?: string | null;
  inspectionID?: string | null;
  pdfURL?: string | null;
  lastReportDate?: any;

  [key: string]: any;
};

const getSortableTimestamp = (value: any) => {
  if (!value) return 0;

  if (typeof value?.toDate === 'function') {
    return value.toDate().getTime();
  }

  if (typeof value?.seconds === 'number') {
    return value.seconds * 1000;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
};

const useCarrierInspectionVehicles = (vendorID?: string | null) => {
  const [vehicles, setVehicles] = useState<CarrierInspectionVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
// console.log ('vendorID carrier',vendorID)
  useEffect(() => {
    if (!vendorID) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const vehiclesRef = collection(
      db,
      'vendor_vehicles',
      vendorID,
      'vehicles',
    );

    const vehiclesQuery = query(vehiclesRef);

    const unsubscribe = onSnapshot(
      vehiclesQuery,
      snapshot => {
        const docs: CarrierInspectionVehicle[] = snapshot.docs.map(vehicleDoc => {
          const data = vehicleDoc.data();
          const inspectionSummary = data?.inspectionSummary || null;

          return {
            id: vehicleDoc.id,
            vehicleID: data?.vehicleID || vehicleDoc.id,
            vendorID,
            ...data,

            type:
              data?.type ||
              inspectionSummary?.vehicleType ||
              null,

            inspectionSummary,

            statusReport: inspectionSummary?.statusReport || null,
            inspectionID: inspectionSummary?.inspectionID || null,
            pdfURL: inspectionSummary?.pdfURL || null,
            lastReportDate: inspectionSummary?.lastReportDate || null,
          };
        });

        docs.sort((a, b) => {
          const aTime = getSortableTimestamp(a?.lastReportDate);
          const bTime = getSortableTimestamp(b?.lastReportDate);
          return bTime - aTime;
        });

        setVehicles(docs);
        setLoading(false);
      },
      err => {
        console.error('[useCarrierInspectionVehicles] Error:', err);
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorID]);

  return {
    vehicles,
    loading,
    error,
  };
};

export default useCarrierInspectionVehicles;