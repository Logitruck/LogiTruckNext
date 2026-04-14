import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';

import { db } from '../../../core/firebase/config';

const useFullInspectionDetails = (
  vendorID?: string,
  inspectionID?: string,
  vehicleID?: string,
) => {
  const [inspectionData, setInspectionData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorID || !inspectionID || !vehicleID) {
      setInspectionData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchInspectionData = async () => {
      try {
        setLoading(true);

        const inspectionRef = doc(
          db,
          'vendor_vehicles',
          vendorID,
          'vehicles',
          vehicleID,
          'inspections',
          inspectionID,
        );

        const inspectionSnap = await getDoc(inspectionRef);

        if (!inspectionSnap.exists()) {
          setInspectionData(null);
          setError('Inspection not found');
          return;
        }

        const data = inspectionSnap.data();

        setInspectionData({
          id: inspectionSnap.id,
          ...data,
        });
        setError(null);
      } catch (err: any) {
        console.error('Error fetching full inspection details:', err);
        setInspectionData(null);
        setError(err?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchInspectionData();
  }, [vendorID, inspectionID, vehicleID]);

  return {
    inspectionData,
    loading,
    error,
  };
};

export default useFullInspectionDetails;