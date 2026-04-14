import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../../core/firebase/config';

const normalizeVehicleType = (data: any): 'Truck' | 'Trailer' | null => {
  const rawType = data?.type || data?.vehicleType || null;

  if (rawType === 'Truck') return 'Truck';
  if (rawType === 'Trailer') return 'Trailer';

  return null;
};

const mapVehicle = (vehicleDoc: any, vendorID: string) => {
  const data = vehicleDoc.data();
  const type = normalizeVehicleType(data);

  return {
    id: vehicleDoc.id,
    vehicleID: data?.vehicleID || vehicleDoc.id,
    vendorID,
    type,
    vehicleType: type,
    number: data?.number || '',
    name: data?.name || '',
    licensePlate: data?.licensePlate || '',
    vin: data?.vin || null,
    make: data?.make || null,
    model: data?.model || null,
    year: data?.year || null,
    status: data?.status || 'active',

    // inspections / operational model
    operationalStatus: data?.operationalStatus || 'pending',
    lastInspectionStatus: data?.lastInspectionStatus || null,
    lastInspectionID: data?.lastInspectionID || null,
    lastInspectionDate: data?.lastInspectionDate || null,
    lastInspectionDriverID: data?.lastInspectionDriverID || null,
    currentAssignedDriverID:
      data?.currentAssignedDriverID || data?.assignedDriverID || null,
    hasOpenDefects: !!data?.hasOpenDefects,
    requiresPretrip: !!data?.requiresPretrip,
    lastInspectionPDF: data?.lastInspectionPDF || null,

    ...data,
  };
};

const mapUser = (userDoc: any) => {
  const data = userDoc.data();

  return {
    id: userDoc.id,
    userID: data?.userID || data?.usersID || userDoc.id,
    usersID: data?.usersID || data?.userID || userDoc.id,
    firstName: data?.firstName || '',
    lastName: data?.lastName || '',
    email: data?.email || '',
    phoneNumber: data?.phoneNumber || '',
    rolesArray: Array.isArray(data?.rolesArray) ? data.rolesArray : [],
    ...data,
  };
};

const sortVehicles = (list: any[]) => {
  return [...list].sort((a, b) => {
    const aLabel = a?.number || a?.name || a?.licensePlate || '';
    const bLabel = b?.number || b?.name || b?.licensePlate || '';
    return String(aLabel).localeCompare(String(bLabel));
  });
};

const sortUsers = (list: any[]) => {
  return [...list].sort((a, b) => {
    const aLabel = `${a?.firstName || ''} ${a?.lastName || ''}`.trim();
    const bLabel = `${b?.firstName || ''} ${b?.lastName || ''}`.trim();
    return aLabel.localeCompare(bLabel);
  });
};

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
        'vehicles',
      );

      const vehiclesSnap = await getDocs(vehiclesRef);

      const truckList: any[] = [];
      const trailerList: any[] = [];

      vehiclesSnap.forEach((vehicleDoc) => {
        const mappedVehicle = mapVehicle(vehicleDoc, vendorID);

        if (mappedVehicle.type === 'Truck') {
          truckList.push(mappedVehicle);
        } else if (mappedVehicle.type === 'Trailer') {
          trailerList.push(mappedVehicle);
        }
      });

      const usersRef = collection(db, 'vendor_users', vendorID, 'users');

      const driversQuery = query(
        usersRef,
        where('rolesArray', 'array-contains', 'driver'),
      );

      const dispatchersQuery = query(
        usersRef,
        where('rolesArray', 'array-contains', 'dispatch'),
      );

      const [driversSnap, dispatchersSnap] = await Promise.all([
        getDocs(driversQuery),
        getDocs(dispatchersQuery),
      ]);

      const driverList: any[] = [];
      const dispatchList: any[] = [];

      driversSnap.forEach((userDoc) => {
        driverList.push(mapUser(userDoc));
      });

      dispatchersSnap.forEach((userDoc) => {
        dispatchList.push(mapUser(userDoc));
      });

      setTrucks(sortVehicles(truckList));
      setTrailers(sortVehicles(trailerList));
      setDrivers(sortUsers(driverList));
      setDispatchers(sortUsers(dispatchList));
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