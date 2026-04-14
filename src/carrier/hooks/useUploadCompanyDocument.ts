import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../../core/firebase/config';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

const useUploadCompanyDocument = () => {
  const currentUser = useCurrentUser();

  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;
console.log('vendorID', vendorID)
  const uploadDocument = async (file: any, type = 'company_docs') => {
    let blob: Blob | null = null;
     
    try {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (!vendorID) {
        throw new Error('Vendor ID not found');
      }

      const fileAsset = file?.assets ? file.assets[0] : file;
      const fileUri = fileAsset?.uri;

      console.log('fileUri', fileUri);
      console.log('fileAsset', fileAsset);

      if (!fileUri) {
        throw new Error('Invalid file URI');
      }

      if (fileAsset?.size === 0) {
        throw new Error('Selected file is empty');
      }

      const fileName =
        fileAsset?.name || file?.name || `document_${Date.now()}.pdf`;

      const safeFileName = `${Date.now()}_${fileName}`;
      const fullPath = `company_documents/${vendorID}/${safeFileName}`;

      const storage = getStorage();
      const storageRef = ref(storage, fullPath);

      blob = await new Promise<Blob>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = () => {
          resolve(xhr.response);
        };

        xhr.onerror = () => {
          reject(new Error('Failed to convert file to blob'));
        };

        xhr.responseType = 'blob';
        xhr.open('GET', fileUri, true);
        xhr.send(null);
      });

      if (!blob) {
        throw new Error('Blob generation failed');
      }

      await uploadBytes(storageRef, blob, {
        contentType: fileAsset?.mimeType || 'application/octet-stream',
      });

      const url = await getDownloadURL(storageRef);

      const docsRef = collection(db, 'vendor_documents', vendorID, 'documents');

      await addDoc(docsRef, {
        name: file.title || fileAsset?.name || file?.name || 'Unnamed document',
        url,
        type: file.type || type || 'company_docs',
        docType: file.docType || 'other',
        uploadedAt: serverTimestamp(),
        uploadedBy: {
          userID: currentUser?.id || currentUser?.userID || '',
          vendorID,
          email: currentUser?.email || '',
          displayName:
            currentUser?.displayName ||
            `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim(),
        },
      });

      return { success: true, url };
    } catch (error) {
      console.error('🔥 Error uploading document:', error);
      throw error;
    } finally {
      if (blob && typeof (blob as any).close === 'function') {
        (blob as any).close();
      }
    }
  };

  return uploadDocument;
};

export default useUploadCompanyDocument;