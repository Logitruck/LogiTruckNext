import { Platform } from 'react-native';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { processMediaFile } from '../../mediaProcessor';

type MediaFile = {
  uri?: string;
  type?: string;
  mimeType?: string;
  mimetype?: string;
  name?: string;
  fileName?: string;
  fileID?: string | number;
  [key: string]: any;
};

type UploadResult = {
  downloadURL?: string | null;
  thumbnailURL?: string | null;
  error?: string;
};

const getFileName = (file: MediaFile): string => {
  const uri = file?.uri ?? '';

  const fallbackName = Platform.select({
    native: uri ? uri.substring(uri.lastIndexOf('/') + 1) : `media_${Date.now()}`,
    default: `media_${Date.now()}`,
  });

  return file?.name || file?.fileName || fallbackName || `media_${Date.now()}`;
};

const getContentType = (file: MediaFile): string => {
  if (file?.mimeType) {
    return file.mimeType;
  }

  if (file?.mimetype) {
    return file.mimetype;
  }

  if (file?.type && file.type.includes('/')) {
    return file.type;
  }

  const fileName = getFileName(file);
  const extension = fileName.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'heic':
      return 'image/heic';
    case 'mp3':
      return 'audio/mpeg';
    case 'm4a':
      return 'audio/mp4';
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'docx':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
};

const buildStoragePath = (file: MediaFile): string => {
  const fileName = getFileName(file);
  const uniqueId = file?.fileID || Date.now();

  return `chat_media/${uniqueId}_${fileName}`;
};

const uriToBlob = async (uri: string): Promise<Blob> => {
  return await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(new Error('Failed to convert file URI to blob'));
    };

    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
};

const uploadFile = async (file: MediaFile): Promise<string | null> => {
  let blob: Blob | null = null;

  try {
    const fileUri = file?.uri;

    if (!fileUri) {
      console.log('uploadFile: invalid file uri');
      return null;
    }

    const storage = getStorage();
    const storagePath = buildStoragePath(file);
    const storageRef = ref(storage, storagePath);

    blob = await uriToBlob(fileUri);

    await uploadBytes(storageRef, blob, {
      contentType: getContentType(file),
    });

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.log('error uploading file', error);
    return null;
  } finally {
    if (blob && typeof (blob as any).close === 'function') {
      (blob as any).close();
    }
  }
};

const processAndUploadMediaFile = async (
  file: MediaFile,
): Promise<UploadResult> => {
  try {
    return await new Promise<UploadResult>((resolve) => {
      processMediaFile(
        file,
        async ({
          processedUri,
        }: {
          processedUri?: string;
          thumbnail?: null;
        }) => {
          try {
            const processedFile: MediaFile = processedUri
              ? {
                  ...file,
                  uri: processedUri,
                }
              : file;

            const downloadURL = await uploadFile(processedFile);

            if (!downloadURL) {
              resolve({ error: 'photoUploadFailed' });
              return;
            }

            resolve({
              downloadURL,
              thumbnailURL: downloadURL,
            });
          } catch (e) {
            console.log('processAndUploadMediaFile error', e);
            resolve({ error: 'photoUploadFailed' });
          }
        },
      );
    });
  } catch (error) {
    console.log('error processing media', error);
    return { error: 'photoUploadFailed' };
  }
};

const uploadMedia = async (mediaAsset: MediaFile) => {
  try {
    const response = await processAndUploadMediaFile(mediaAsset);

    if (response?.error || !response.downloadURL) {
      return null;
    }

    return {
      ...mediaAsset,
      downloadURL: response.downloadURL,
      thumbnailURL: response.thumbnailURL ?? response.downloadURL,
    };
  } catch (error) {
    console.log('error uploading media', error);
    return null;
  }
};

const firebaseStorage = {
  processAndUploadMediaFile,
  uploadMedia,
};

export default firebaseStorage;