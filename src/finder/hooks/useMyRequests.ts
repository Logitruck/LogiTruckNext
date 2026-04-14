import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '../../core/firebase/config';

type RequestItem = {
  id: string;
  status?: string;
  contract_status?: string;
  [key: string]: any;
};

const ACTIVE_STATUSES = [
  'sending',
  'offered',
  'accepted',
  'to_sign',
  'execution',
  'open',
  'confirmed',
];

const HISTORY_STATUSES = [
  'cancelled',
  'closed',
  'completed',
];

const useMyRequests = (creatorUserID?: string) => {
  const [activeRequests, setActiveRequests] = useState<RequestItem[]>([]);
  const [historyRequests, setHistoryRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!creatorUserID) {
  setActiveRequests([]);
  setHistoryRequests([]);
  setLoading(false);
  return;
}

    setLoading(true);

    const requestsRef = collection(firestore, 'requests');
    const requestsQuery = query(
      requestsRef,
      where('createdBy.userID', '==', creatorUserID)
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const all: RequestItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setActiveRequests(
          all.filter((req) => ACTIVE_STATUSES.includes(req.status ?? ''))
        );

        setHistoryRequests(
          all.filter((req) => HISTORY_STATUSES.includes(req.status ?? ''))
        );

        setLoading(false);
      },
      (error) => {
        console.warn('Error loading requests:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [creatorUserID]);

  return { activeRequests, historyRequests, loading };
};

export default useMyRequests;