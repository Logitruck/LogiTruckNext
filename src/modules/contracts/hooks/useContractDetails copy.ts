import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';

const useAcceptedOfferDetails = (request: any) => {
  const currentUser = useCurrentUser();
  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const [acceptedOffer, setAcceptedOffer] = useState<any | null>(null);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [submittedDocuments, setSubmittedDocuments] = useState<any[]>([]);
  const [vendorData, setVendorData] = useState<any | null>(null);
  const [contractStatus, setContractStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requestID = request?.id;
    const confirmedVendor = request?.confirmedVendor;

    if (!requestID || !confirmedVendor || !finderID) {
      setAcceptedOffer(null);
      setChecklistItems([]);
      setSubmittedDocuments([]);
      setVendorData(null);
      setContractStatus(null);
      setLoading(false);
      return;
    }

    let unsubscribeVendorRequest: (() => void) | null = null;
    let unsubscribeDocuments: (() => void) | null = null;

    const fetchData = async () => {
      try {
        setLoading(true);

        const requestRef = doc(db, 'requests', requestID);
        const requestSnap = await getDoc(requestRef);

        if (!requestSnap.exists()) {
          throw new Error('Request not found');
        }

        const requestData = requestSnap.data();

        if (requestData?.finderID !== finderID) {
          throw new Error('Unauthorized access');
        }

        const vendorRequestRef = doc(
          db,
          'vendor_requests',
          confirmedVendor,
          'requests',
          requestID
        );

        const documentsRef = collection(
          db,
          'vendor_requests',
          confirmedVendor,
          'requests',
          requestID,
          'documents'
        );

        unsubscribeVendorRequest = onSnapshot(vendorRequestRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setAcceptedOffer(data.offer ?? null);
            setChecklistItems(data.checklistItems ?? []);
            setContractStatus(data.contract_status ?? null);
          } else {
            setAcceptedOffer(null);
            setChecklistItems([]);
            setContractStatus(null);
          }
        });

        unsubscribeDocuments = onSnapshot(documentsRef, (snapshot) => {
          const docs = snapshot.docs.map((docItem) => ({
            id: docItem.id,
            ...docItem.data(),
          }));
          setSubmittedDocuments(docs);
        });

        const vendorRef = doc(db, 'vendors', confirmedVendor);
        const vendorSnap = await getDoc(vendorRef);

        if (vendorSnap.exists()) {
          setVendorData({
            id: vendorSnap.id,
            ...vendorSnap.data(),
          });
        } else {
          setVendorData(null);
        }
      } catch (error) {
        console.error('Error in useAcceptedOfferDetails:', error);
        setAcceptedOffer(null);
        setChecklistItems([]);
        setSubmittedDocuments([]);
        setVendorData(null);
        setContractStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      unsubscribeVendorRequest?.();
      unsubscribeDocuments?.();
    };
  }, [request?.id, request?.confirmedVendor, finderID]);

  const refresh = async () => {
    return true;
  };

  return {
    acceptedOffer,
    checklistItems,
    submittedDocuments,
    vendorData,
    contractStatus,
    loading,
    refresh,
  };
};

export default useAcceptedOfferDetails;