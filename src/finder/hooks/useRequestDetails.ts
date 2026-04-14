import { useEffect, useState } from 'react';
import {
  collectionGroup,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useRequestDetails = (requestID: string) => {
  const currentUser = useCurrentUser();
  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [request, setRequest] = useState<any | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    if (!requestID || !finderID) {
      setRequest(null);
      setOffers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const requestRef = doc(db, 'requests', requestID);

    const unsubscribeRequest = onSnapshot(
      requestRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const requestData = snapshot.data();

          if (requestData?.finderID !== finderID) {
            console.warn('[Unauthorized request access]');
            setRequest(null);
            setOffers([]);
            setLoading(false);
            return;
          }

          setRequest({
            id: snapshot.id,
            ...requestData,
          });
        } else {
          console.warn('[Request not found]');
          setRequest(null);
          setOffers([]);
          setLoading(false);
        }
      },
      (err) => {
        console.error('[Firestore Error - Request]:', err);
        setError(err);
        setLoading(false);
      }
    );

    const offersQuery = query(
      collectionGroup(db, 'requests'),
      where('requestRef', '==', requestRef)
    );

    const unsubscribeOffers = onSnapshot(
      offersQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const received = snapshot.docs
            .map((offerDoc) => ({
              id: offerDoc.id,
              ...offerDoc.data(),
              vendorID: offerDoc.ref.parent.parent?.id || 'unknown',
            }))
            .filter((item: any) => item.status === 'offered');

          setOffers(received);
        } else {
          setOffers([]);
        }

        setLoading(false);
      },
      (err) => {
        console.error('[Firestore Error - Offers]:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeRequest();
      unsubscribeOffers();
    };
  }, [requestID, finderID]);

  return {
    request,
    offers,
    loading,
    error,
  };
};

export default useRequestDetails;