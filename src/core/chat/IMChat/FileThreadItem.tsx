import React from 'react';
import { Image, Text, View, TouchableOpacity, Linking } from 'react-native';

import { useTheme, useTranslations } from '../../dopebase';
import dynamicStyles from './styles';

type FileItem = {
  url?: string;
  name?: string;
  [key: string]: any;
};

type FileThreadItemProps = {
  item: FileItem;
  outBound?: boolean;
};

const FileThreadItem = ({ item, outBound = false }: FileThreadItemProps) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance, outBound);

  const handleOpenFile = async () => {
    if (!item?.url) {
      return;
    }

    try {
      await Linking.openURL(item.url);
    } catch (error) {
      console.log('Error opening file URL:', error);
    }
  };

  return (
    <View style={styles.bodyContainer}>
      <Image
        style={styles.icon}
        source={require('../assets/new-document.png')}
      />

      <TouchableOpacity onPress={handleOpenFile} activeOpacity={0.8}>
        <Text numberOfLines={1} style={styles.title}>
          {item?.name ?? localized('File')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FileThreadItem;