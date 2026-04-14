import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const VALID_STATES = ['sending', 'offered', 'accepted', 'to_sign', 'execution'];

const useDealsByTab = (activeTab: string) => {
  const currentUser = useCurrentUser();
  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [allDeals, setAllDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!finderID) {
      setAllDeals([]);
      setCounters({});
      setLoading(false);
      return;
    }

    setLoading(true);

    const requestsRef = collection(db, 'requests');
    const q = query(
      requestsRef,
      where('finderID', '==', finderID),
      where('status', 'in', VALID_STATES),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setAllDeals(all);

        const counts = all.reduce((acc: Record<string, number>, curr: any) => {
          acc[curr.status] = (acc[curr.status] || 0) + 1;
          return acc;
        }, {});

        setCounters(counts);
        setLoading(false);
      },
      (error) => {
        console.error('Firestore error in useDealsByTab:', error);
        setAllDeals([]);
        setCounters({});
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [finderID]);

  const filteredDeals = useMemo(
    () => allDeals.filter((deal: any) => deal.status === activeTab),
    [allDeals, activeTab],
  );

  return {
    deals: filteredDeals,
    loading,
    counters,
  };
};

export default useDealsByTab;