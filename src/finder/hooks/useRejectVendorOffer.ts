import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type RejectVendorOfferParams = {
  requestID: string;
  vendorID: string;
};

const useRejectVendorOffer = () => {
  const currentUser = useCurrentUser();
  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  return async ({ requestID, vendorID }: RejectVendorOfferParams) => {
    try {
      if (!requestID || !vendorID) {
        throw new Error('Missing requestID or vendorID');
      }

      if (!finderID) {
        throw new Error('Missing finder vendorID');
      }

      const requestRef = doc(db, 'requests', requestID);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestSnap.data();

      if (requestData?.finderID !== finderID) {
        throw new Error('Unauthorized action');
      }

      const vendorRequestRef = doc(
        db,
        'vendor_requests',
        vendorID,
        'requests',
        requestID,
      );

      await updateDoc(vendorRequestRef, {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });

      console.log(`Offer rejected for ${vendorID}/${requestID}`);
      return true;
    } catch (error) {
      console.error('Error rejecting vendor offer:', error);
      throw error;
    }
  };
};

export default useRejectVendorOffer;