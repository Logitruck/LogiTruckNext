import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

import { auth, db } from '../../../../../core/firebase/config';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';

type VendorDocument = {
  id: string;
  title?: string;
  name?: string;
  docType?: string;
  url?: string;
  [key: string]: any;
};

const AssociateDocumentsScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const route = useRoute<any>();
  const { requestID } = route?.params || {};

  const [documents, setDocuments] = useState<VendorDocument[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
          const currentUser = useCurrentUser();

        if (!currentUser?.uid) {
          throw new Error('User not authenticated');
        }

        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        const vendorID = userDoc.data()?.vendorID;

        if (!vendorID) {
          throw new Error('Vendor ID not found');
        }

        const vendorDocsRef = collection(
          db,
          'vendor_documents',
          vendorID,
          'documents'
        );

        const snapshot = await getDocs(vendorDocsRef);

        const docs: VendorDocument[] = snapshot.docs.map((snapshotDoc) => ({
          id: snapshotDoc.id,
          ...snapshotDoc.data(),
        }));

        setDocuments(docs);
      } catch (error) {
        console.warn('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const toggleSelect = (docID: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docID)
        ? prev.filter((id) => id !== docID)
        : [...prev, docID]
    );
  };

  const handleSubmit = async () => {
    try {
      if (!requestID) {
        Alert.alert(localized('Error'), localized('Missing request ID'));
        return;
      }

      setSubmitting(true);

        const currentUser = useCurrentUser();
      if (!currentUser?.uid) {
        throw new Error('User not authenticated');
      }

      const userRef = doc(db, 'users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      const vendorID = userDoc.data()?.vendorID;

      if (!vendorID) {
        throw new Error('Vendor ID not found');
      }

      const batch = writeBatch(db);

      selectedDocs.forEach((docID) => {
        const selectedDocument = documents.find((docItem) => docItem.id === docID);

        if (!selectedDocument) return;

        const documentRef = doc(
          db,
          'vendor_requests',
          vendorID,
          'requests',
          requestID,
          'documents',
          docID
        );

        batch.set(documentRef, {
          ...selectedDocument,
          checklistItemLabel: selectedDocument.checklistItemLabel ?? null,
          status: selectedDocument.status ?? 'pending',
          associatedAt: serverTimestamp(),
        });
      });

      await batch.commit();

      Alert.alert(
        localized('Success'),
        localized('Documents associated successfully')
      );
    } catch (error) {
      console.error('Error saving document association:', error);
      Alert.alert(
        localized('Error'),
        localized('Failed to associate documents')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderItem = ({ item }: { item: VendorDocument }) => {
    const selected = selectedDocs.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.card, selected && styles.cardSelected]}
        onPress={() => toggleSelect(item.id)}
      >
        <Text style={styles.cardTitle}>{item.title || item.name || '—'}</Text>
        <Text style={styles.cardSubtitle}>{item.docType || '—'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{localized('Associate Documents')}</Text>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {localized('No documents available')}
            </Text>
          }
        />
      )}

      {submitting ? (
        <ActivityIndicator
          style={styles.bottomLoader}
          color={theme.colors[appearance].primaryForeground}
        />
      ) : (
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{localized('Save')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default AssociateDocumentsScreen;