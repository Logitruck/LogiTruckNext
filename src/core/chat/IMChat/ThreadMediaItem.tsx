import React from 'react';
import { View, Image } from 'react-native';
import { Image as FastImage } from 'expo-image';
import { useTheme } from '../../dopebase';
import FileThreadItem from './FileThreadItem';

type MediaItem = {
  url?: string;
  type?: string;
  [key: string]: any;
};

type ThreadItemData = {
  media?: MediaItem | null;
  url?: string;
  [key: string]: any;
};

type ThreadMediaItemProps = {
  dynamicStyles: any;
  videoRef?: React.RefObject<any>;
  item: ThreadItemData;
  outBound?: boolean;
  updateItemImagePath?: (path: string) => void;
};

export default function ThreadMediaItem({
  dynamicStyles,
  item,
  outBound,
}: ThreadMediaItemProps) {
  const { theme } = useTheme();

  const isValidUrl =
    item.media?.url && typeof item.media.url === 'string'
      ? item.media.url.startsWith('http')
      : false;

  const uri = isValidUrl ? item.media?.url || item.url || '' : '';

  const isImage =
    item.media && item.media.type && item.media.type.startsWith('image');
  const isFile =
    item.media && item.media.type && item.media.type.startsWith('file');
  const isAudio =
    item.media && item.media.type && item.media.type.startsWith('audio');
  const isVideo =
    item.media && item.media.type && item.media.type.startsWith('video');
const assets = {
  playButton: require('../assets/play.png'),
};
  if (isImage) {
    return <FastImage source={{ uri }} style={dynamicStyles.mediaMessage} />;
  }




if (isFile && item.media) {
  return <FileThreadItem item={item.media} outBound={outBound} />;
}

if (isAudio || isVideo) {
  return (
    <View style={[dynamicStyles.mediaMessage, dynamicStyles.centerItem]}>
      <Image
        source={assets.playButton}
        style={dynamicStyles.playButton}
        resizeMode="contain"
      />
    </View>
  );
}

  return <FastImage source={{ uri }} style={dynamicStyles.mediaMessage} />;
}