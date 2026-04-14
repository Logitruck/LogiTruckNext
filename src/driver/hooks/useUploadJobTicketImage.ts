import { useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { db } from '../../core/firebase/config';

type TicketType = 'pickup' | 'delivery';

type UploadTicketResult = {
  success: boolean;
  url: string;
};

const uriToBlob = (uri: string): Promise<Blob> => {
  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(new Error('Failed to convert image to blob'));
    };

    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

export const useUploadJobTicketImage = (
  channelID?: string,
  projectID?: string,
) => {
  const uploadTicketImage = useCallback(
    async (
      jobID: string,
      uri: string,
      type: TicketType = 'pickup',
    ): Promise<UploadTicketResult> => {
      let blob: Blob | null = null;

      try {
        if (!channelID || !projectID || !jobID || !uri) {
          throw new Error('Missing required parameters for uploading ticket');
        }

        const ticketID = `${type}_${Date.now()}`;
        const path = `tickets/${channelID}/${projectID}/${jobID}/${ticketID}.jpg`;

        const storage = getStorage();
        const storageRef = ref(storage, path);

        blob = await uriToBlob(uri);

        if (!blob) {
          throw new Error('Blob generation failed');
        }

        await uploadBytes(storageRef, blob, {
          contentType: 'image/jpeg',
        });

        const downloadURL = await getDownloadURL(storageRef);

        const jobRef = doc(
          db,
          'project_channels',
          channelID,
          'projects',
          projectID,
          'jobs',
          jobID,
        );

        const field: 'pickupTicket' | 'deliveryTicket' =
          type === 'pickup' ? 'pickupTicket' : 'deliveryTicket';

        await updateDoc(jobRef, {
          [field]: {
            url: downloadURL,
            uploadedAt: serverTimestamp(),
          },
        });

        return {
          success: true,
          url: downloadURL,
        };
      } catch (error) {
        console.error('🔥 Error uploading ticket image:', error);
        throw error;
      } finally {
        if (blob && typeof (blob as any).close === 'function') {
          (blob as any).close();
        }
      }
    },
    [channelID, projectID],
  );

  return { uploadTicketImage };
};