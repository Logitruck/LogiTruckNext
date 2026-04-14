import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const normalizeType = (value?: string) => {
  if (value === 'Truck') return 'Truck';
  if (value === 'Trailer') return 'Trailer';
  return null;
};

const sortVehicles = (items: any[]) => {
  return [...items].sort((a, b) => {
    const aLabel = a?.number || a?.name || a?.licensePlate || '';
    const bLabel = b?.number || b?.name || b?.licensePlate || '';
    return String(aLabel).localeCompare(String(bLabel));
  });
};

const useVendorVehicles = (vendorID?: string) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vendorID) {
      setVehicles([]);
      setLoading(false);
      return;
    }

    const vehiclesRef = collection(db, 'vendor_vehicles', vendorID, 'vehicles');
    const vehiclesQuery = query(vehiclesRef);

    const unsubscribe = onSnapshot(
      vehiclesQuery,
      (snapshot) => {
        const mapped = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          const type = normalizeType(data?.type || data?.vehicleType);

          return {
            id: docSnap.id,
            vehicleID: data?.vehicleID || docSnap.id,
            vendorID,
            ...data,
            type,
            vehicleType: type,
          };
        });

        setVehicles(sortVehicles(mapped));
        setLoading(false);
      },
      (error) => {
        console.error('🔥 Error fetching vendor vehicles:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorID]);

  const trucks = useMemo(
    () => vehicles.filter((item) => item.type === 'Truck'),
    [vehicles],
  );

  const trailers = useMemo(
    () => vehicles.filter((item) => item.type === 'Trailer'),
    [vehicles],
  );

  return {
    vehicles,
    trucks,
    trailers,
    loading,
  };
};

export default useVendorVehicles;