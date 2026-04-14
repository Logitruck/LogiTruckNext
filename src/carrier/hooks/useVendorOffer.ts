import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useVendorOffer = (requestID?: string) => {
  const currentUser = useCurrentUser();
  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requestID || !vendorID) {
      setOffer(null);
      setLoading(false);
      return;
    }

    const vendorRequestRef = doc(
      db,
      'vendor_requests',
      vendorID,
      'requests',
      requestID,
    );

    const unsubscribe = onSnapshot(
      vendorRequestRef,
      (snapshot) => {
        try {
          if (!snapshot.exists()) {
            setOffer(null);
            setLoading(false);
            return;
          }

          const data = snapshot.data();

          setOffer({
            id: snapshot.id,
            ...(data || {}),
          });
        } catch (error) {
          console.warn('[useVendorOffer] Error fetching vendor offer:', error);
          setOffer(null);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.warn('[useVendorOffer] Snapshot error:', error);
        setOffer(null);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [requestID, vendorID]);

  return { offer, loading };
};

export default useVendorOffer;