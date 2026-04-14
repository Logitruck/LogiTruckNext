import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  onSnapshot,
  collection,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type VendorRequestItem = {
  id: string;
  status?: string;
  offer?: any;
  requestRef?: DocumentReference;
  [key: string]: any;
};

const useVendorRequestsList = () => {
  const currentUser = useCurrentUser();
  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: null | (() => void) = null;

    const setupListener = async () => {
      setLoading(true);

      try {
        if (!vendorID) {
          console.warn('[useVendorRequestsList] VendorID no encontrado.');
          setRequests([]);
          setLoading(false);
          return;
        }

        const vendorRequestsRef = collection(
          db,
          'vendor_requests',
          vendorID,
          'requests',
        );

        unsubscribeSnapshot = onSnapshot(
          vendorRequestsRef,
          async (snapshot) => {
            try {
              const enrichedRequests = await Promise.all(
                snapshot.docs.map(async (snapshotDoc) => {
                  const vendorRequest = snapshotDoc.data() as VendorRequestItem;
                  let fullRequest = null;

                  try {
                    const requestRef = vendorRequest.requestRef;

                    if (requestRef) {
                      const requestDoc = await getDoc(requestRef);
                      fullRequest = requestDoc.exists()
                        ? requestDoc.data()
                        : null;
                    }
                  } catch (error) {
                    console.warn(
                      '[useVendorRequestsList] Error obteniendo request principal',
                      error,
                    );
                  }

                  return {
                    id: snapshotDoc.id,
                    vendorStatus: vendorRequest.status,
                    offer: vendorRequest.offer || null,
                    ...(fullRequest || {}),
                  };
                }),
              );

              setRequests(enrichedRequests);
            } catch (error) {
              console.error(
                '[useVendorRequestsList] Error procesando snapshot:',
                error,
              );
              setRequests([]);
            } finally {
              setLoading(false);
            }
          },
          (error) => {
            console.error(
              '[useVendorRequestsList] Error en onSnapshot:',
              error,
            );
            setRequests([]);
            setLoading(false);
          },
        );
      } catch (error) {
        console.error('[useVendorRequestsList] Error:', error);
        setRequests([]);
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [vendorID]);

  return { requests, loading };
};

export default useVendorRequestsList;