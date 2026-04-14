import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useRequestDetails = (requestID: string) => {
  const currentUser = useCurrentUser();
  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!requestID || !vendorID) {
      setRequest(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
        if (!snapshot.exists()) {
          setRequest(null);
          setLoading(false);
          return;
        }

        setRequest({
          id: snapshot.id,
          ...snapshot.data(),
        });
        setLoading(false);
      },
      (err) => {
        console.error('[useRequestDetails] Error:', err);
        setError(err);
        setRequest(null);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [requestID, vendorID]);

  return {
    request,
    loading,
    error,
  };
};

export default useRequestDetails;