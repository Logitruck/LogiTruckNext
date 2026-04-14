import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../core/firebase/config';

const useChecklistDocumentActions = (
  request: any,
  refresh?: () => void,
  localized?: (key: string) => string
) => {
  const vendorID = request?.vendorID || request?.confirmedVendor || null;
  const requestID = request?.id || null;

  const viewDocument = useCallback((documentItem: any) => {
    if (documentItem?.url) {
      Linking.openURL(documentItem.url);
    }
  }, []);

  const removeDocument = useCallback(
    async (documentItem: any) => {
      try {
        if (!vendorID || !requestID || !documentItem?.id) {
          throw new Error('Missing vendorID, requestID or documentID');
        }

        const documentRef = doc(
          db,
          'vendor_requests',
          vendorID,
          'requests',
          requestID,
          'documents',
          documentItem.id
        );

        await deleteDoc(documentRef);
        await refresh?.();
      } catch (error) {
        console.error('❌ Error removing document:', error);
        Alert.alert(
          localized?.('Error') ?? 'Error',
          localized?.('Failed to remove document') ?? 'Failed to remove document'
        );
      }
    },
    [vendorID, requestID, refresh, localized]
  );

  const sendDocument = useCallback(
    async (documentItem: any) => {
      try {
        if (!vendorID || !requestID || !documentItem?.id) {
          throw new Error('Missing vendorID, requestID or documentID');
        }

        const documentRef = doc(
          db,
          'vendor_requests',
          vendorID,
          'requests',
          requestID,
          'documents',
          documentItem.id
        );

        await updateDoc(documentRef, {
          status: 'sent',
          updatedAt: serverTimestamp(),
        });

        await refresh?.();
      } catch (error) {
        console.error('❌ Error sending document:', error);
        Alert.alert(
          localized?.('Error') ?? 'Error',
          localized?.('Failed to send document') ?? 'Failed to send document'
        );
      }
    },
    [vendorID, requestID, refresh, localized]
  );

  const replaceDocument = useCallback(
    async (documentItem: any, newData: any) => {
      try {
        if (!vendorID || !requestID || !documentItem?.id) {
          throw new Error('Missing vendorID, requestID or documentID');
        }

        const documentRef = doc(
          db,
          'vendor_requests',
          vendorID,
          'requests',
          requestID,
          'documents',
          documentItem.id
        );

        await updateDoc(documentRef, {
          ...newData,
          status: 'pending',
          replacedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await refresh?.();
      } catch (error) {
        console.error('❌ Error replacing document:', error);
        throw error;
      }
    },
    [vendorID, requestID, refresh]
  );

  return {
    viewDocument,
    removeDocument,
    sendDocument,
    replaceDocument,
  };
};

export default useChecklistDocumentActions;