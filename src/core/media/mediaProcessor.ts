import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy'
import * as ImageManipulator from 'expo-image-manipulator';

const BASE_DIR = `${FileSystem.cacheDirectory}expo-cache/`;

type DownloadResult = {
  uri: string | null;
};

type MediaFile = {
  uri?: string;
  path?: string;
  type?: string;
  fileName?: string;
  name?: string;
  mimeType?: string;
  [key: string]: any;
};

type ProcessedMediaResult = {
  processedUri?: string;
  thumbnail?: null;
};

type ProcessMediaCallback = (result: ProcessedMediaResult) => void;

async function ensureDirExists(givenDir: string): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(givenDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(givenDir, { intermediates: true });
  }
}

export const downloadFile = async (
  file: string,
  fileName: string,
): Promise<DownloadResult | FileSystem.FileSystemDownloadResult> => {
  try {
    await ensureDirExists(BASE_DIR);

    const fileUri = `${BASE_DIR}${fileName}`;
    const info = await FileSystem.getInfoAsync(fileUri);

    if (info.exists) {
      return { uri: info.uri };
    }

    const downloadResumable = FileSystem.createDownloadResumable(file, fileUri);
    const result = await downloadResumable.downloadAsync();

    if (!result) {
      return { uri: null };
    }

    return result;
  } catch (error) {
    console.log('downloadFile error', error);
    return { uri: null };
  }
};

const resizeImage = async (
  image: MediaFile,
  callback: (processedUri: string) => void,
): Promise<void> => {
  const imagePath = image?.path || image?.uri;

  if (!imagePath) {
    callback('');
    return;
  }

  try {
    const newSource = await ImageManipulator.manipulateAsync(imagePath, [], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    callback(newSource.uri);
  } catch (err) {
    console.log('resizeImage error', err);
    callback(imagePath);
  }
};

export const processMediaFile = (
  file: MediaFile,
  callback: ProcessMediaCallback,
): void => {
  const { type, uri, path } = file;
  const fileSource = uri || path || '';

  const includesImage = type?.includes('image');
  if (includesImage) {
    resizeImage(file, processedUri => callback({ processedUri, thumbnail: null }));
    return;
  }

  callback({ processedUri: fileSource, thumbnail: null });
};

export const blendVideoWithAudio = async (): Promise<never> => {
  throw new Error('Video is not supported in the current implementation');
};