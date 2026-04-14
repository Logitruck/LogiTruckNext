import { Alert } from 'react-native';
import {
  doc,
  collection,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

import { auth, db } from '../../../core/firebase/config';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return await response.blob();
};

const fileUriToBlob = async (fileUri: string) => {
  const response = await fetch(fileUri);
  return await response.blob();
};

const useUploadSignedContract = (
  localized: (key: string) => string,
  navigation: any
) => {
  const currentUser = useCurrentUser();

  const upload = async (
    request: any,
    role: 'finder' | 'carrier',
    pdfUri: string,
    signatureDataUrl: string
  ) => {
    try {
      const user = auth.currentUser;
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }

      const currentVendorID =
        currentUser?.activeVendorID ||
        currentUser?.vendorID ||
        null;

      if (!currentVendorID) {
        throw new Error('Missing active vendorID');
      }

      const requestID = request?.id;
      const targetVendorID =
        request?.confirmedVendor ||
        request?.vendorID ||
        null;

      if (!requestID || !targetVendorID) {
        throw new Error('Missing request or vendor information');
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

      const resolvedCarrierVendorID =
        requestData?.confirmedVendor ||
        request?.vendorID ||
        null;

      if (role === 'carrier' && resolvedCarrierVendorID !== currentVendorID) {
        throw new Error('Unauthorized carrier signature');
      }

      const vendorRequestRef = doc(
        db,
        'vendor_requests',
        targetVendorID,
        'requests',
        requestID
      );

      const storage = getStorage();

      // 1. Subir firma a Storage
      const signatureBlob = await dataUrlToBlob(signatureDataUrl);
      const signatureRef = ref(
        storage,
        `contracts/${requestID}/${role}_signature.png`
      );

      await uploadBytes(signatureRef, signatureBlob, {
        contentType: 'image/png',
      });

      const signatureURL = await getDownloadURL(signatureRef);

      // 2. Subir PDF firmado a Storage
      const pdfBlob = await fileUriToBlob(pdfUri);
      const pdfRef = ref(storage, `contracts/${requestID}/signed_contract.pdf`);

      await uploadBytes(pdfRef, pdfBlob, {
        contentType: 'application/pdf',
      });

      const pdfURL = await getDownloadURL(pdfRef);

      // 3. Guardar firma en subcolección del request global
      const signatureDocRef = doc(
        db,
        'requests',
        requestID,
        'contract_signatures',
        role
      );

      await setDoc(signatureDocRef, {
        role,
        signatureURL,
        pdfURL,
        signedAt: serverTimestamp(),
        signedBy: {
          userID: currentUser?.id || currentUser?.userID || '',
          vendorID: currentVendorID,
          email: currentUser?.email || user.email || '',
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || '',
        },
      });

      // 4. Verificar si ya están ambas firmas
      const signaturesCollectionRef = collection(
        db,
        'requests',
        requestID,
        'contract_signatures'
      );

      const snapshot = await getDocs(signaturesCollectionRef);
      const signedRoles = snapshot.docs.map((snapshotDoc) => snapshotDoc.id);

      const bothSigned =
        signedRoles.includes('carrier') && signedRoles.includes('finder');

      // 5. Actualizar request global
      const updates: Record<string, any> = {
        [`contract.${role}SignatureURL`]: signatureURL,
        [`contract.${role}PdfURL`]: pdfURL,
        [`contract.signedAt_${role}`]: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (bothSigned) {
        updates.status = 'signed';
        updates.contract_status = 'signed';
      } else {
        updates.contract_status = 'partially_signed';
      }

      await updateDoc(requestRef, updates);

      // 6. Actualizar vendor_request
      await updateDoc(vendorRequestRef, {
        contract_status: bothSigned ? 'signed' : 'partially_signed',
        ...(bothSigned ? { status: 'signed' } : {}),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        localized('Success'),
        bothSigned
          ? localized('Contract signed by both parties')
          : localized('Signature saved. Waiting for the other party.')
      );

      navigation.goBack();
    } catch (error) {
      console.error('❌ Error uploading contract:', error);
      Alert.alert(
        localized('Error'),
        localized('Failed to upload signed contract')
      );
    }
  };

  return { upload };
};

export default useUploadSignedContract;