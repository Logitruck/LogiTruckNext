import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import * as ExpoDocumentPicker from 'expo-document-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';

type FileSelectorFieldProps = {
  label: string;
  file: any;
  onChange: (file: any) => void;
};

const FileSelectorField = ({ label, file, onChange }: FileSelectorFieldProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const handlePickFile = async () => {
    try {
      const result = await ExpoDocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: '*/*',
      });

      if (result.canceled) {
        return;
      }

      onChange(result);
    } catch (error) {
      console.error('❌ Error selecting file:', error);
      Alert.alert(localized('Error'), localized('Could not select file'));
    }
  };

  const fileAsset = file?.assets?.[0] || file;
  const fileName = fileAsset?.name || localized('No file selected');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Pressable style={styles.field} onPress={handlePickFile}>
        <View style={styles.fileInfo}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={20}
            color={theme.colors[appearance].primaryText}
          />
          <Text style={styles.fileName} numberOfLines={1}>
            {fileName}
          </Text>
        </View>

        <MaterialCommunityIcons
          name="upload"
          size={20}
          color={theme.colors[appearance].primaryText}
        />
      </Pressable>
    </View>
  );
};

export default FileSelectorField;