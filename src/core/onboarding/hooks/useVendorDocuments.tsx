import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';
export type VendorDocument = {
  id: string;
  title?: string;
  name?: string;
  url?: string;
  uploadedAt?: any;
  [key: string]: any;
};

const useVendorDocuments = () => {
  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);

    try {
        const currentUser = useCurrentUser();

      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);

      const vendorID = userDoc.data()?.vendorID;
      if (!vendorID) {
        throw new Error('Vendor ID not found');
      }

      const docsRef = collection(
        db,
        'vendor_documents',
        vendorID,
        'documents'
      );

      const q = query(docsRef, orderBy('uploadedAt', 'desc'));

      const snapshot = await getDocs(q);

      const docs: VendorDocument[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setDocuments(docs);
    } catch (error) {
      console.warn('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    refresh: fetchDocuments,
  };
};

export default useVendorDocuments;