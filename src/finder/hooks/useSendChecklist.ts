import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type SendChecklistParams = {
  requestID: string;
};

const useSendChecklist = () => {
  const currentUser = useCurrentUser();

  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  return async ({ requestID }: SendChecklistParams) => {
    try {
      if (!requestID) {
        throw new Error('Missing requestID');
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

      const updatePayload = {
        contract_status: 'waiting_list',
        updatedAt: serverTimestamp(),
        updatedBy: {
          userID: resolvedUserID,
          email: currentUser?.email || '',
          displayName: resolvedDisplayName,
        },
      };

      await updateDoc(requestRef, updatePayload);

      console.log(`Checklist sent for request ${requestID}`);
      return true;
    } catch (error) {
      console.error('Error sending checklist:', error);
      throw error;
    }
  };
};

export default useSendChecklist;