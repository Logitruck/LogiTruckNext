import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useVendorOffer = (
  requestID: string,
  externalVendorID: string | null = null
) => {
  const currentUser = useCurrentUser();
  const resolvedVendorID =
    externalVendorID ||
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [offer, setOffer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        if (!requestID || !resolvedVendorID) {
          setOffer(null);
          setLoading(false);
          return;
        }

        const requestRef = doc(
          db,
          'vendor_requests',
          resolvedVendorID,
          'requests',
          requestID
        );

        const requestSnap = await getDoc(requestRef);
        const data = requestSnap.data();

        if (data?.offer) {
          setOffer(data.offer);
        } else {
          setOffer(null);
        }
      } catch (error) {
        console.warn('[useVendorOffer] Error fetching offer:', error);
        setOffer(null);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchOffer();
  }, [requestID, resolvedVendorID]);

  return { offer, loading };
};

export default useVendorOffer;