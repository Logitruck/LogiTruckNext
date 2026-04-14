import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';

import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

export type OfferCounts = {
  pending: number;
  offered: number;
  accepted: number;
  ready: number;
  to_sign: number;
  execution: number;
  signed: number;
};

const initialCounts: OfferCounts = {
  pending: 0,
  offered: 0,
  accepted: 0,
  ready: 0,
  to_sign: 0,
  execution: 0,
  signed: 0,
};

const useDashboardOffersSummary = (): {
  counts: OfferCounts;
  loading: boolean;
} => {
  const currentUser = useCurrentUser();

  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [counts, setCounts] = useState<OfferCounts>(initialCounts);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: null | (() => void) = null;

    if (!vendorID) {
      setCounts(initialCounts);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const vendorRequestsRef = collection(
        db,
        'vendor_requests',
        vendorID,
        'requests',
      );

      unsubscribeSnapshot = onSnapshot(
        vendorRequestsRef,
        querySnap => {
          const updatedCounts: OfferCounts = {
            pending: 0,
            offered: 0,
            accepted: 0,
            ready: 0,
            to_sign: 0,
            execution: 0,
            signed: 0,
          };

          querySnap.forEach(snapshotDoc => {
            const status = snapshotDoc.data()?.status as keyof OfferCounts | undefined;

            if (status && status in updatedCounts) {
              updatedCounts[status] += 1;
            }
          });

          setCounts(updatedCounts);
          setLoading(false);
        },
        error => {
          console.error(
            '[useDashboardOffersSummary] Error in onSnapshot:',
            error,
          );
          setCounts(initialCounts);
          setLoading(false);
        },
      );
    } catch (error) {
      console.error('[useDashboardOffersSummary] Error:', error);
      setCounts(initialCounts);
      setLoading(false);
    }

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [vendorID]);

  return { counts, loading };
};

export default useDashboardOffersSummary;