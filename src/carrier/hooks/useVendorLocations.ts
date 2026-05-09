import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

export interface VendorLocation {
  id: string;
  [key: string]: any;
}

export interface UseVendorLocationsReturn {
  locations: VendorLocation[];
  loading: boolean;
  error: Error | null;
}

export function useVendorLocations(vendorID: string): UseVendorLocationsReturn {
  const { user } = useCurrentUser();
  const [locations, setLocations] = useState<VendorLocation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || !vendorID) {
      setLoading(false);
      return () => {};
    }

    const ref = collection(db, 'vendor_locations', vendorID, 'locations');
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        try {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as VendorLocation));
          setLocations(docs);
          setError(null);
          setLoading(false);
        } catch (e) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setLoading(false);
        }
      },
      (error) => {
        setError(error instanceof Error ? error : new Error(String(error)));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user, vendorID]);

  return { locations, loading, error };
}