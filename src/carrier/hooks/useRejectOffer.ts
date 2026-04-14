import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type RejectOfferParams = {
  requestID: string;
  status?: 'rejected' | 'cancelled';
  reason?: string;
};

const useRejectOffer = () => {
  const currentUser = useCurrentUser();
  const vendorID = currentUser?.vendorID;

  const rejectOffer = async ({
    requestID,
    status = 'rejected',
    reason = '',
  }: RejectOfferParams) => {
    try {
      if (!vendorID || !requestID) {
        throw new Error('Missing vendorID or requestID');
      }

      const requestRef = doc(
        db,
        'vendor_requests',
        vendorID,
        'requests',
        requestID,
      );

      await updateDoc(requestRef, {
        status,
        rejectionReason: reason,
        updatedAt: serverTimestamp(),
      });

      console.log(`✅ Vendor request updated to ${status} successfully`);
      return true;
    } catch (error) {
      console.error('🔥 Error updating vendor request status:', error);
      throw error;
    }
  };

  return { rejectOffer };
};

export default useRejectOffer;