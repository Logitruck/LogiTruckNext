import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type UpdateRequestStatusParams = {
  requestID: string;
  status: string;
  vendorID?: string | null;
};

const useUpdateRequestStatus = () => {
  const currentUser = useCurrentUser();

  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  return async ({
    requestID,
    status,
    vendorID = null,
  }: UpdateRequestStatusParams) => {
    try {
      if (!requestID || !status) {
        throw new Error('Missing requestID or status');
      }

      if (!currentUser) {
        throw new Error('User not authenticated');
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

      const resolvedUserID =
        currentUser?.id ||
        currentUser?.userID ||
        '';

      const resolvedDisplayName =
        currentUser?.displayName ||
        `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();

      const updatePayload: any = {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: {
          userID: resolvedUserID,
          email: currentUser?.email || '',
          displayName: resolvedDisplayName,
        },
      };

      if (status === 'accepted') {
        if (!vendorID) {
          throw new Error('Missing vendorID for accepted status');
        }

        updatePayload.confirmedVendor = vendorID;
      }

      await updateDoc(requestRef, updatePayload);

      console.log(`Request ${requestID} updated to '${status}'`);
      return true;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  };
};

export default useUpdateRequestStatus;