import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../core/firebase/config';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';
import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';

import useVendorDocuments from '../../hooks/useVendorDocuments';
import useUploadCompanyDocument from '../../hooks/useUploadCompanyDocument';
import UploadDocumentModal from './documents/uploadDocumentModal/UploadDocumentModal';

type VendorDocument = {
  id: string;
  title?: string;
  name?: string;
  url?: string;
  uploadedAt?: any;
  docType?: string;
  type?: string;
  [key: string]: any;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  requestID: string;
  checklistItem: string | null;
  onAssociationComplete?: () => void;
};

const DocumentAssociationModal = ({
  visible,
  onClose,
  requestID,
  checklistItem,
  onAssociationComplete,
}: Props) => {
  const currentUser = useCurrentUser();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const vendorID =
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const { documents, loading, refresh } = useVendorDocuments();
  const uploadDocument = useUploadCompanyDocument();

  const [associating, setAssociating] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const handleAssociate = async (documentItem: VendorDocument) => {
    setAssociating(true);

    try {
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      if (!vendorID) {
        throw new Error('Vendor ID not found');
      }

      const documentsRef = collection(
        db,
        'vendor_requests',
        vendorID,
        'requests',
        requestID,
        'documents'
      );

      await addDoc(documentsRef, {
        title: documentItem.title || documentItem.name || 'Unnamed Document',
        url: documentItem.url || '',
        docID: documentItem.id || '',
        uploadedAt: documentItem.uploadedAt ?? serverTimestamp(),
        checklistItemLabel: checklistItem || null,
        status: 'pending',
        docType: documentItem.docType || 'other',
        type: documentItem.type || 'company_docs',
        associatedAt: serverTimestamp(),
        associatedBy: {
          userID: currentUser?.id || currentUser?.userID || '',
          vendorID,
          email: currentUser?.email || '',
        },
      });

      Alert.alert(
        localized('Success'),
        localized('Document associated')
      );

      onAssociationComplete?.();
      handleCloseAll();
    } catch (error) {
      console.error('❌ Error associating document:', error);
      Alert.alert(
        localized('Error'),
        localized('Association failed')
      );
    } finally {
      setAssociating(false);
    }
  };

  const handleUploadAndRefresh = async (file: any) => {
    try {
      await uploadDocument(file);
      await refresh();
      setUploadModalVisible(false);

      Alert.alert(
        localized('Success'),
        localized('Document uploaded successfully. You can now associate it.')
      );
    } catch (error) {
      console.error('❌ Error uploading document from association modal:', error);
      Alert.alert(
        localized('Error'),
        localized('Upload failed')
      );
    }
  };

  const renderItem = ({ item }: { item: VendorDocument }) => (
    <View style={styles.row}>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle} numberOfLines={1}>
          {item.title || item.name || '—'}
        </Text>

        <Text style={styles.docDate}>
          {localized('Uploaded at')}:{' '}
          {item.uploadedAt?.toDate
            ? new Date(item.uploadedAt.toDate()).toDateString()
            : '-'}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          style={styles.smallButton}
          onPress={() => {
            if (item.url) {
              Linking.openURL(item.url);
            }
          }}
        >
          <Text style={styles.smallButtonText}>{localized('View')}</Text>
        </Pressable>

        <Pressable
          style={styles.smallButton}
          onPress={() => handleAssociate(item)}
          disabled={associating}
        >
          <Text style={styles.smallButtonText}>{localized('Associate')}</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyText}>
        {localized('No documents available')}
      </Text>

      <Text style={styles.emptySubtext}>
        {localized('Upload a company document to continue')}
      </Text>
    </View>
  );

  const handleCloseAll = () => {
    setUploadModalVisible(false);
    setAssociating(false);
    onClose();
  };

  return (
    <>
      <Modal
        animationType="slide"
        transparent
        visible={visible && !uploadModalVisible}
        onRequestClose={handleCloseAll}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.headerRow}>
              <Text style={styles.modalTitle}>
                {localized('Select Document to Associate')}
              </Text>

              <Pressable
                style={styles.uploadButton}
                onPress={() => setUploadModalVisible(true)}
                disabled={associating}
              >
                <Text style={styles.uploadButtonText}>
                  {localized('Upload')}
                </Text>
              </Pressable>
            </View>

            {(loading || associating) && (
              <ActivityIndicator
                style={styles.loader}
                size="small"
                color={theme.colors[appearance].primaryForeground}
              />
            )}

            {!loading && (
              <FlatList
                data={documents}
                keyExtractor={(item: VendorDocument) => item.id}
                renderItem={renderItem}
                ListEmptyComponent={renderEmptyState}
                showsVerticalScrollIndicator={false}
              />
            )}

            <Pressable
              style={styles.cancelButton}
              onPress={handleCloseAll}
              disabled={associating}
            >
              <Text style={styles.cancelButtonText}>{localized('Cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <UploadDocumentModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUpload={handleUploadAndRefresh}
      />
    </>
  );
};

export default DocumentAssociationModal;