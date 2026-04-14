import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  ListRenderItem,
} from 'react-native';
import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';

export type ContextItem = {
  id: string;
  title: string;
  subtitle?: string;
  searchText?: string;
  raw?: any;
};

type SelectContextItemModalProps = {
  isVisible: boolean;
  onClose: () => void;
  items: ContextItem[];
  loading?: boolean;
  title?: string;
  placeholder?: string;
  emptyText?: string;
  loadingText?: string;
  onSelect: (item: ContextItem) => void;
};

const SelectContextItemModal = ({
  isVisible,
  onClose,
  items,
  loading = false,
  title,
  placeholder,
  emptyText,
  loadingText,
  onSelect,
}: SelectContextItemModalProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const [searchText, setSearchText] = useState('');
  const [filteredItems, setFilteredItems] = useState<ContextItem[]>([]);

  useEffect(() => {
    if (!items) {
      setFilteredItems([]);
      return;
    }

    if (searchText.trim().length > 0) {
      const filter = searchText.toLowerCase();

      setFilteredItems(
        items.filter(
          (item) =>
            item.title?.toLowerCase().includes(filter) ||
            item.subtitle?.toLowerCase().includes(filter) ||
            item.searchText?.toLowerCase().includes(filter),
        ),
      );
    } else {
      setFilteredItems(items);
    }
  }, [items, searchText]);

  const renderItem: ListRenderItem<ContextItem> = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onSelect(item)}
    >
      <Text style={styles.itemTitle}>{item.title}</Text>
      {!!item.subtitle && (
        <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>{localized('Close')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {title || localized('Select Item')}
          </Text>

          <View style={{ width: 60 }} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder || localized('Search...')}
            placeholderTextColor={theme.colors[appearance].primaryText}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {loading ? (
          <View style={styles.centeredContent}>
            <Text style={styles.loadingText}>
              {loadingText || localized('Loading items...')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.centeredContent}>
                <Text style={styles.emptyText}>
                  {emptyText || localized('No items found')}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default SelectContextItemModal;