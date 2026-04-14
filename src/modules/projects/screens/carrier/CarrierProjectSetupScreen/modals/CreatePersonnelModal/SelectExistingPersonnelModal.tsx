import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useCarrierResources from '../../../../../hooks/carrier/useCarrierResources';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorID: string;
  type: 'driver' | 'dispatch';
  excludedIDs?: string[];
  onSelect: (person: any) => void;
};

const getPersonLabel = (person: any) =>
  `${person?.firstName || ''} ${person?.lastName || ''}`.trim() ||
  person?.email ||
  person?.id ||
  '-';

const getPersonMeta = (person: any) =>
  person?.email || person?.phoneNumber || person?.status || '-';

const SelectExistingPersonnelModal = ({
  visible,
  onClose,
  vendorID,
  type,
  excludedIDs = [],
  onSelect,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const insets = useSafeAreaInsets();

  const { drivers, dispatchers, loading } = useCarrierResources(vendorID);
  const [search, setSearch] = useState('');

  const sourceItems = type === 'driver' ? drivers : dispatchers;

  const filteredItems = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return sourceItems.filter((item: any) => {
      if (excludedIDs.includes(item.id)) return false;

      if (!cleanSearch) return true;

      const haystack = [
        item?.firstName,
        item?.lastName,
        item?.email,
        item?.phoneNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(cleanSearch);
    });
  }, [sourceItems, excludedIDs, search]);

  const modalTitle =
    type === 'driver'
      ? localized('Select Existing Driver')
      : localized('Select Existing Dispatcher');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View
          style={[
            styles.innerContainer,
            { paddingTop: Math.max(insets.top, 12) },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title} numberOfLines={2}>
                {modalTitle}
              </Text>
            </View>

            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
          </View>

          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={localized('Search by name, email or phone')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />

          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors[appearance].primaryForeground}
              />
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.card}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{getPersonLabel(item)}</Text>
                    <Text style={styles.cardMeta}>{getPersonMeta(item)}</Text>
                  </View>

                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons
                      name="plus-circle-outline"
                      size={24}
                      color={theme.colors[appearance].primaryForeground}
                    />
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    {localized('No available personnel found')}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default SelectExistingPersonnelModal;