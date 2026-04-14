import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import SelectField from '../SelectField/SelectField';
import FileSelectorField from '../FileSelectorField/FileSelectorField';

type UploadDocumentModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpload: (file: any) => Promise<void>;
  defaultCategory?: string;
};

const CATEGORY_OPTIONS = [
  { label: 'Company', value: 'company_docs' },
  { label: 'Vehicles', value: 'vehicles' },
  { label: 'Drivers', value: 'drivers' },
];

const DOC_TYPE_OPTIONS_BY_CATEGORY: Record<string, { label: string; value: string }[]> = {
  company_docs: [
    { label: 'Insurance', value: 'insurance' },
    { label: 'License', value: 'license' },
    { label: 'Contract', value: 'contract' },
    { label: 'Other', value: 'other' },
  ],
  vehicles: [
    { label: 'Insurance', value: 'insurance' },
    { label: 'Registration', value: 'registration' },
    { label: 'Technical Inspection', value: 'inspection' },
    { label: 'Other', value: 'other' },
  ],
  drivers: [
    { label: 'License', value: 'license' },
    { label: 'Medical Certificate', value: 'medical_certificate' },
    { label: 'Background Check', value: 'background_check' },
    { label: 'Other', value: 'other' },
  ],
};

const UploadDocumentModal = ({
  visible,
  onClose,
  onUpload,
  defaultCategory = 'company_docs',
}: UploadDocumentModalProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const [category, setCategory] = useState(defaultCategory);
  const [docType, setDocType] = useState('insurance');
  const [customName, setCustomName] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const docTypeOptions = useMemo(() => {
    return DOC_TYPE_OPTIONS_BY_CATEGORY[category] || DOC_TYPE_OPTIONS_BY_CATEGORY.company_docs;
  }, [category]);

  const reset = () => {
    setCategory(defaultCategory);
    setDocType(
      (DOC_TYPE_OPTIONS_BY_CATEGORY[defaultCategory] || DOC_TYPE_OPTIONS_BY_CATEGORY.company_docs)[0]
        ?.value || 'insurance'
    );
    setCustomName('');
    setSelectedFile(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    const firstDocType =
      (DOC_TYPE_OPTIONS_BY_CATEGORY[value] || DOC_TYPE_OPTIONS_BY_CATEGORY.company_docs)[0]?.value ||
      'other';
    setDocType(firstDocType);
  };

  const handleUpload = async () => {
    const fileAsset = selectedFile?.assets?.[0] || selectedFile;

    if (!fileAsset?.uri) {
      Alert.alert(localized('Error'), localized('Please choose a file'));
      return;
    }

    const enrichedFile = {
      ...fileAsset,
      type: category,
      docType,
      title: customName?.trim() || fileAsset.name || 'Unnamed document',
    };

    try {
      setUploading(true);
      await onUpload(enrichedFile);
      handleClose();
    } catch (error) {
      console.error('❌ Upload failed:', error);
      Alert.alert(localized('Error'), localized('Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{localized('Upload Document')}</Text>

          <SelectField
            label={localized('Category')}
            value={category}
            options={CATEGORY_OPTIONS.map((item) => ({
              ...item,
              label: localized(item.label),
            }))}
            onChange={handleCategoryChange}
          />

          <SelectField
            label={localized('Document Type')}
            value={docType}
            options={docTypeOptions.map((item) => ({
              ...item,
              label: localized(item.label),
            }))}
            onChange={setDocType}
          />

          <Text style={styles.modalLabel}>{localized('Document Name')}</Text>
          <TextInput
            style={styles.input}
            placeholder={localized('Enter name')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
            value={customName}
            onChangeText={setCustomName}
          />

          <FileSelectorField
            label={localized('Choose File')}
            file={selectedFile}
            onChange={setSelectedFile}
          />

          {uploading ? (
            <ActivityIndicator
              style={styles.loader}
              size="large"
              color={theme.colors[appearance].primaryForeground}
            />
          ) : (
            <Pressable style={styles.button} onPress={handleUpload}>
              <Text style={styles.buttonText}>{localized('Upload')}</Text>
            </Pressable>
          )}

          <Pressable
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={uploading}
          >
            <Text style={styles.cancelButtonText}>{localized('Cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default UploadDocumentModal;