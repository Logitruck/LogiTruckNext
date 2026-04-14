import { useEffect, useState } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';

type ContractSignatures = {
  finder: string | null;
  signedAtFinder: any | null;
  carrier: string | null;
  signedAtCarrier: any | null;
};

const initialState: ContractSignatures = {
  finder: null,
  signedAtFinder: null,
  carrier: null,
  signedAtCarrier: null,
};

const useContractSignatures = (requestID?: string) => {
  const currentUser = useCurrentUser();
  const currentVendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const resolvedUserID =
    currentUser?.id ||
    currentUser?.userID ||
    '';

  const [signatures, setSignatures] = useState<ContractSignatures>(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchSignatures = async () => {
    if (!requestID) {
      setSignatures(initialState);
      setLoading(false);
      return;
    }

    try {
      const finderRef = doc(
        db,
        'requests',
        requestID,
        'contract_signatures',
        'finder'
      );
      const carrierRef = doc(
        db,
        'requests',
        requestID,
        'contract_signatures',
        'carrier'
      );

      const [finderDoc, carrierDoc] = await Promise.all([
        getDoc(finderRef),
        getDoc(carrierRef),
      ]);

      setSignatures({
        finder: finderDoc.exists()
          ? finderDoc.data()?.signatureData ??
            finderDoc.data()?.signatureURL ??
            null
          : null,
        signedAtFinder: finderDoc.exists()
          ? finderDoc.data()?.signedAt ?? null
          : null,
        carrier: carrierDoc.exists()
          ? carrierDoc.data()?.signatureData ??
            carrierDoc.data()?.signatureURL ??
            null
          : null,
        signedAtCarrier: carrierDoc.exists()
          ? carrierDoc.data()?.signedAt ?? null
          : null,
      });
    } catch (err) {
      console.error('[useContractSignatures] Error fetching signatures:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignatures();
  }, [requestID]);

  const saveSignature = async (
    role: 'finder' | 'carrier',
    signatureData: string
  ) => {
    try {
      if (!resolvedUserID) {
        throw new Error('Not authenticated');
      }

      if (!currentVendorID) {
        throw new Error('Missing active vendorID');
      }

      if (!requestID) {
        throw new Error('Missing requestID');
      }

      const requestRef = doc(db, 'requests', requestID);
      const requestSnap = await getDoc(requestRef);

      if (!requestSnap.exists()) {
        throw new Error('Request not found');
      }

      const requestData = requestSnap.data();

      if (role === 'finder' && requestData?.finderID !== currentVendorID) {
        throw new Error('Unauthorized finder signature');
      }

      if (
        role === 'carrier' &&
        requestData?.confirmedVendor !== currentVendorID
      ) {
        throw new Error('Unauthorized carrier signature');
      }

      const signatureRef = doc(
        db,
        'requests',
        requestID,
        'contract_signatures',
        role
      );

      await setDoc(
        signatureRef,
        {
          role,
          signatureData,
          signedAt: serverTimestamp(),
          updatedBy: {
            userID: resolvedUserID,
            vendorID: currentVendorID,
            email: currentUser?.email || '',
            firstName: currentUser?.firstName || '',
            lastName: currentUser?.lastName || '',
          },
        },
        { merge: true }
      );

      await fetchSignatures();
    } catch (err) {
      console.error('[useContractSignatures] Error saving signature:', err);
      setError(err);
      throw err;
    }
  };

  return {
    signatures,
    loading,
    error,
    saveSignature,
  };
};

export default useContractSignatures;