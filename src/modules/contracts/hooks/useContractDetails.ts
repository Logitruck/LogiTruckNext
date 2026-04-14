import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/config';

const useAcceptedOfferDetails = (request: any) => {
  const [acceptedOffer, setAcceptedOffer] = useState<any | null>(null);
  const [checklistItems, setChecklistItems] = useState<any[]>([]);
  const [submittedDocuments, setSubmittedDocuments] = useState<any[]>([]);
  const [vendorData, setVendorData] = useState<any | null>(null);
  const [contractStatus, setContractStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const requestID = request?.id;
    const confirmedVendor = request?.confirmedVendor || request?.vendorID;

    if (!requestID || !confirmedVendor) {
      setAcceptedOffer(null);
      setChecklistItems([]);
      setSubmittedDocuments([]);
      setVendorData(null);
      setContractStatus(null);
      setLoading(false);
      return; 
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

    let unsubscribeVendorRequest: null | (() => void) = null;
    let unsubscribeDocuments: null | (() => void) = null;

    const setup = async () => {
      try {
        setLoading(true);

        unsubscribeVendorRequest = onSnapshot(vendorRequestRef, (snapshot) => {
          if (!snapshot.exists()) {
            setAcceptedOffer(null);
            setChecklistItems([]);
            setContractStatus(null);
            return;
          }

          const data = snapshot.data();

          setAcceptedOffer(data?.offer ?? null);
          setChecklistItems(Array.isArray(data?.checklistItems) ? data.checklistItems : []);
          setContractStatus(data?.contract_status ?? null);
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

    setup();

    return () => {
      unsubscribeVendorRequest?.();
      unsubscribeDocuments?.();
    };
  }, [request?.id, request?.confirmedVendor]);

  const refresh = async () => true;

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