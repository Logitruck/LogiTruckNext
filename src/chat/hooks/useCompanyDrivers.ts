import { useEffect, useState } from 'react';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';
import { db } from '../../core/firebase/config';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

type Driver = {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  profilePictureURL?: string;
  role?: string;
  raw?: any;
};

const useCompanyDrivers = () => {
  const currentUser = useCurrentUser();

  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  // console.log('vendorID useCompanies',vendorID)

  useEffect(() => {
    if (!vendorID) {
      setDrivers([]);
      setLoading(false);
      return;
    }

const q = query(
  collection(db, 'vendor_users', vendorID, 'users'),
  where('rolesArray', 'array-contains', 'driver'),
);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Driver[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          const firstName = data?.firstName || '';
          const lastName = data?.lastName || '';

          return {
            id: doc.id,
            firstName,
            lastName,
            fullName:
              data?.fullName ||
              `${firstName} ${lastName}`.trim(),
            email: data?.email || '',
            profilePictureURL: data?.profilePictureURL || '',
            role: data?.role || 'driver',
            raw: data,
          };
        });

        setDrivers(list);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading drivers:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [vendorID]);

  return {
    drivers,
    loading,
  };
};

export default useCompanyDrivers;