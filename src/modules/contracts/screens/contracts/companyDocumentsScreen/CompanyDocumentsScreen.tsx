import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';

import useVendorDocuments from '../../../../../carrier/hooks/useVendorDocuments';
import UploadDocumentModal from '../../../../../carrier/components/contract/documents/uploadDocumentModal/UploadDocumentModal';
import useUploadCompanyDocument from '../../../../../carrier/hooks/useUploadCompanyDocument';

type VendorDocument = {
  id: string;
  name?: string;
  title?: string;
  url?: string;
  type?: string;
  docType?: string;
  uploadedAt?: any;
  [key: string]: any;
};

const CompanyDocumentsScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState('company_docs');
  const [modalVisible, setModalVisible] = useState(false);

  const { documents, loading, refresh } = useVendorDocuments();
  const uploadDocument = useUploadCompanyDocument();

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      title: localized('Documents'),
      headerRight: () => (
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <MaterialCommunityIcons
            name="upload"
            size={24}
            color={colors.primaryText}
            style={{ marginRight: 16 }}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme, appearance, localized]);

  const filteredDocs = documents.filter(
    (documentItem: VendorDocument) => documentItem.type === activeTab
  );

  const formatUploadedDate = (uploadedAt: any) => {
    if (!uploadedAt) return '-';

    if (uploadedAt?.toDate) {
      return uploadedAt.toDate().toLocaleDateString();
    }

    if (uploadedAt?._seconds) {
      return new Date(uploadedAt._seconds * 1000).toLocaleDateString();
    }

    try {
      return new Date(uploadedAt).toLocaleDateString();
    } catch {
      return '-';
    }
  };

  const renderItem = ({ item }: { item: VendorDocument }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (item.url) {
          Linking.openURL(item.url);
        }
      }}
    >
      <Text style={styles.cardTitle}>{item.name || item.title || '—'}</Text>

      <Text style={styles.cardSubtitle}>
        {localized('Type')}: {item.docType || '—'}
      </Text>

      <Text style={styles.cardSubtitle}>
        {localized('Uploaded at')}: {formatUploadedDate(item.uploadedAt)}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'company_docs' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('company_docs')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'company_docs' && styles.tabTextActive,
            ]}
          >
            {localized('Company')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'vehicles' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('vehicles')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'vehicles' && styles.tabTextActive,
            ]}
          >
            {localized('Vehicles')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'drivers' && styles.tabItemActive,
          ]}
          onPress={() => setActiveTab('drivers')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'drivers' && styles.tabTextActive,
            ]}
          >
            {localized('Drivers')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : (
        <FlatList
          data={filteredDocs}
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

      <UploadDocumentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onUpload={async (documentItem: any) => {
          await uploadDocument(documentItem);
          refresh();
        }}
      />
    </View>
  );
};

export default CompanyDocumentsScreen;