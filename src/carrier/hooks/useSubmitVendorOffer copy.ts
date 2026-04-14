import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type SubmitOfferParams = {
  requestID: string;
  price: number;
  estimatedDays: number;
  availableTrucks: number;
  estimatedStartDate: Date | null;
  comment?: string;
};

const useSubmitVendorOffer = () => {
  const currentUser = useCurrentUser();
  const vendorID = currentUser?.vendorID;

  return async ({
    requestID,
    price,
    estimatedDays,
    availableTrucks,
    estimatedStartDate,
    comment = '',
  }: SubmitOfferParams) => {
    try {
      if (
        !vendorID ||
        !requestID ||
        isNaN(price) ||
        isNaN(estimatedDays)
      ) {
        throw new Error('Missing or invalid fields');
      }

      const offerRef = doc(db, 'vendor_requests', vendorID, 'requests', requestID);

      const offerData = {
        status: 'offered',
        offer: {
          price: price ?? 0,
          estimatedDays: estimatedDays ?? 0,
          availableTrucks: Number(availableTrucks) || 0,
          estimatedStartDate: estimatedStartDate ?? null,
          comment: comment ?? '',
          createdAt: serverTimestamp(),
          submittedBy: {
            uid: currentUser?.id ?? currentUser?.userID ?? '',
            email: currentUser?.email ?? '',
            displayName:
              currentUser?.displayName ??
              `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim(),
          },
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(offerRef, offerData, { merge: true });

      console.log('✅ Oferta enviada y guardada correctamente');
      return true;
    } catch (error) {
      console.error('🔥 Error enviando oferta:', error);
      throw error;
    }
  };
};

export default useSubmitVendorOffer;