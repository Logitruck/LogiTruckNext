import {
  doc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useSubmitContract = () => {
  const currentUser = useCurrentUser();

  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const submitContract = async (requestID: string) => {
    try {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (!vendorID) {
        throw new Error('Vendor ID not found');
      }

      if (!requestID) {
        throw new Error('Missing requestID');
      }

      const vendorRequestRef = doc(
        db,
        'vendor_requests',
        vendorID,
        'requests',
        requestID
      );

      const vendorRequestDoc = await getDoc(vendorRequestRef);

      if (!vendorRequestDoc.exists()) {
        throw new Error('Vendor request document does not exist');
      }

      const docsRef = collection(
        db,
        'vendor_requests',
        vendorID,
        'requests',
        requestID,
        'documents'
      );

      const docsSnapshot = await getDocs(docsRef);
      const batch = writeBatch(db);

      docsSnapshot.forEach((snapshotDoc) => {
        batch.update(snapshotDoc.ref, {
          status: 'sent',
          updatedAt: serverTimestamp(),
        });
      });

      batch.update(vendorRequestRef, {
        contract_status: 'send_documents',
        updatedAt: serverTimestamp(),
        updatedBy: {
          userID: currentUser?.id || currentUser?.userID || '',
          vendorID,
          email: currentUser?.email || '',
          displayName:
            currentUser?.displayName ||
            `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
        },
      });

      await batch.commit();

      return { success: true };
    } catch (error) {
      console.error('🔥 Error submitting contract:', error);
      throw error;
    }
  };

  return submitContract;
};

export default useSubmitContract;