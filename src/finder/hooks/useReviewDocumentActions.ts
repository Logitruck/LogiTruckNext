import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useReviewDocumentActions = (
  request: any,
  refresh?: () => void,
  localized: (key: string) => string = (key) => key
) => {
  const currentUser = useCurrentUser();
  const finderID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const viewDocument = useCallback((documentItem: any) => {
    if (documentItem?.url) {
      Linking.openURL(documentItem.url);
    }
  }, []);

  const approveDocument = useCallback(
    async (documentID: string) => {
      try {
        const vendorID = request?.confirmedVendor;
        const requestID = request?.id;

        if (!finderID) {
          throw new Error('Missing finder vendorID');
        }

        if (!vendorID || !requestID || !documentID) {
          throw new Error('Missing vendorID, requestID, or documentID');
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

        const documentRef = doc(
          db,
          'vendor_requests',
          vendorID,
          'requests',
          requestID,
          'documents',
          documentID
        );

        await updateDoc(documentRef, {
          status: 'approved',
        });

        refresh?.();
      } catch (error) {
        console.error('Error approving document:', error);
        Alert.alert(localized('Error'), localized('Failed to approve document'));
      }
    },
    [finderID, request, refresh, localized]
  );

  const rejectDocument = useCallback(
    async (documentID: string) => {
      try {
        const vendorID = request?.confirmedVendor;
        const requestID = request?.id;

        if (!finderID) {
          throw new Error('Missing finder vendorID');
        }

        if (!vendorID || !requestID || !documentID) {
          throw new Error('Missing vendorID, requestID, or documentID');
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

        const documentRef = doc(
          db,
          'vendor_requests',
          vendorID,
          'requests',
          requestID,
          'documents',
          documentID
        );

        await updateDoc(documentRef, {
          status: 'rejected',
        });

        refresh?.();
      } catch (error) {
        console.error('Error rejecting document:', error);
        Alert.alert(localized('Error'), localized('Failed to reject document'));
      }
    },
    [finderID, request, refresh, localized]
  );

  return {
    viewDocument,
    approveDocument,
    rejectDocument,
  };
};

export default useReviewDocumentActions;