import { useEffect, useState, useCallback } from 'react';
import { collection, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const useCarrierResources = (vendorID?: string) => {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [trailers, setTrailers] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchResources = useCallback(async () => {
    if (!vendorID) {
      setTrucks([]);
      setTrailers([]);
      setDrivers([]);
      setDispatchers([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const vehiclesRef = collection(
        db,
        'vendor_vehicles',
        vendorID,
        'vehicles'
      );

      const vehiclesSnap = await getDocs(vehiclesRef);

      const truckList: any[] = [];
      const trailerList: any[] = [];

      vehiclesSnap.forEach((vehicleDoc) => {
        const data = vehicleDoc.data();

        if (data.type === 'Truck') {
          truckList.push({ id: vehicleDoc.id, ...data });
        } else if (data.type === 'Trailer') {
          trailerList.push({ id: vehicleDoc.id, ...data });
        }
      });

      const usersRef = collection(
        db,
        'vendor_users',
        vendorID,
        'users'
      );

      const driversQuery = query(
        usersRef,
        where('rolesArray', 'array-contains', 'Driver')
      );
      const dispatchersQuery = query(
        usersRef,
        where('rolesArray', 'array-contains', 'Dispatch')
      );

      const [driversSnap, dispatchersSnap] = await Promise.all([
        getDocs(driversQuery),
        getDocs(dispatchersQuery),
      ]);

      const driverList: any[] = [];
      const dispatchList: any[] = [];

      driversSnap.forEach((userDoc) => {
        driverList.push({ id: userDoc.id, ...userDoc.data() });
      });

      dispatchersSnap.forEach((userDoc) => {
        dispatchList.push({ id: userDoc.id, ...userDoc.data() });
      });

      setTrucks(truckList);
      setTrailers(trailerList);
      setDrivers(driverList);
      setDispatchers(dispatchList);
      setError(null);
    } catch (err) {
      console.error('🔥 Error fetching carrier resources:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [vendorID]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  return {
    trucks,
    trailers,
    drivers,
    dispatchers,
    loading,
    error,
    refresh: fetchResources,
  };
};

export default useCarrierResources;