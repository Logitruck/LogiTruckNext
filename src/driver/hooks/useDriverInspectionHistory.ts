import { useEffect, useState } from 'react';
import {
  collectionGroup,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';

type DriverInspectionHistoryItem = {
  id: string;
  inspectionID?: string;
  vehicleID?: string | null;
  vehicleType?: 'Truck' | 'Trailer' | string;
  statusReport?: string | null;
  lastReportDate?: any;
  createdAt?: any;
  pdfURL?: string | null;
  truckID?: string | null;
  trailerID?: string | null;
  vehicleLabel?: string | null;
  lastDriverID?: string | null;
  [key: string]: any;
};

const normalizeHistoryItem = (
  docId: string,
  data: any,
): DriverInspectionHistoryItem => {
  const vehicleID =
    data?.vehicleID ||
    data?.truckID ||
    data?.trailerID ||
    null;

  const vehicleType =
    data?.vehicleType ||
    (data?.truckID ? 'Truck' : data?.trailerID ? 'Trailer' : 'Vehicle');

  const vehicleLabel =
    data?.vehicleLabel ||
    data?.vehicleNumber ||
    data?.number ||
    vehicleID ||
    null;

  return {
    id: docId,
    inspectionID: data?.inspectionID || docId,
    vehicleID,
    vehicleType,
    statusReport: data?.statusReport || null,
    lastReportDate: data?.lastReportDate || null,
    createdAt: data?.createdAt || null,
    pdfURL: data?.pdfURL || data?.reportURL || null,
    truckID: data?.truckID || null,
    trailerID: data?.trailerID || null,
    vehicleLabel,
    lastDriverID: data?.lastDriverID || data?.driverID || null,
    ...data,
  };
};

const sortByMostRecent = (items: DriverInspectionHistoryItem[]) => {
  return [...items].sort((a, b) => {
    const aDate =
      a?.lastReportDate?.seconds ||
      a?.createdAt?.seconds ||
      0;

    const bDate =
      b?.lastReportDate?.seconds ||
      b?.createdAt?.seconds ||
      0;

    return bDate - aDate;
  });
};

const useDriverInspectionHistory = (driverID?: string | null) => {
  const [inspections, setInspections] = useState<DriverInspectionHistoryItem[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!driverID) {
      setInspections([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const inspectionsQuery = query(
      collectionGroup(db, 'inspections'),
      where('lastDriverID', '==', driverID),
    );

    const unsubscribe = onSnapshot(
      inspectionsQuery,
      snapshot => {
        try {
          const history = snapshot.docs.map(docSnap =>
            normalizeHistoryItem(docSnap.id, docSnap.data()),
          );

          setInspections(sortByMostRecent(history));
          setLoading(false);
        } catch (err) {
          console.error('🔥 Error processing driver inspection history:', err);
          setError(err);
          setInspections([]);
          setLoading(false);
        }
      },
      async snapshotErr => {
        console.warn(
          '⚠️ lastDriverID query failed, trying fallback driverID query:',
          snapshotErr,
        );

        try {
          const fallbackQuery = query(
            collectionGroup(db, 'inspections'),
            where('driverID', '==', driverID),
          );

          const fallbackSnap = await getDocs(fallbackQuery);

          const history = fallbackSnap.docs.map(docSnap =>
            normalizeHistoryItem(docSnap.id, docSnap.data()),
          );

          setInspections(sortByMostRecent(history));
          setLoading(false);
        } catch (fallbackErr) {
          console.error('🔥 Error fetching driver inspection history:', fallbackErr);
          setError(fallbackErr);
          setInspections([]);
          setLoading(false);
        }
      },
    );

    return () => unsubscribe();
  }, [driverID]);

  return {
    inspections,
    loading,
    error,
  };
};

export default useDriverInspectionHistory;