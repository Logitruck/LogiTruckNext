import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { getDoc } from 'firebase/firestore';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useMarkRequestToSign = () => {
  const markToSign = async (requestID: string) => {
    try {
      const requestRef = doc(db, 'requests', requestID);

      await updateDoc(requestRef, {
        status: 'to_sign',
        contract_status: 'to_sign',
      });
    } catch (error) {
      console.error('Error marking request to sign:', error);
      throw error;
    }
  };

  return markToSign;
};

export default useMarkRequestToSign;