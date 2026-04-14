import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';
import { db } from '../../../../core/firebase/config';

const ChecklistScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { requestID, vendorID, initialChecklist = [] } = route?.params || {};

  const [items, setItems] = useState<string[]>(initialChecklist);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Edit Checklist'),
    });
  }, [navigation, localized]);

  const addItem = () => {
    const trimmed = newItem.trim();

    if (!trimmed) {
      return;
    }

    if (items.includes(trimmed)) {
      Alert.alert(
        localized('Duplicate Item'),
        localized('This item is already in the list.')
      );
      return;
    }

    setItems((prev) => [...prev, trimmed]);
    setNewItem('');
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const saveChecklist = async () => {
    if (!vendorID || !requestID) {
      Alert.alert(
        localized('Error'),
        localized('Missing vendorID or requestID')
      );
      return;
    }

    setLoading(true);

    try {
      const vendorRequestRef = doc(
        db,
        'vendor_requests',
        vendorID,
        'requests',
        requestID
      );

      await updateDoc(vendorRequestRef, {
        checklistItems: items,
        checklistUpdatedAt: serverTimestamp(),
      });

      Alert.alert(
        localized('Success'),
        localized('Checklist saved successfully')
      );

      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al guardar checklist:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not save the checklist')
      );
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: string;
    index: number;
  }) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemText}>• {item}</Text>

      <Pressable onPress={() => removeItem(index)} style={styles.removeButton}>
        <Text style={styles.removeText}>✕</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{localized('Edit Document Checklist')}</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newItem}
          onChangeText={setNewItem}
          placeholder={localized('Add item')}
          placeholderTextColor={theme.colors[appearance].secondaryText}
        />

        <Pressable style={styles.addButton} onPress={addItem}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {localized('No items added')}
          </Text>
        }
      />

      <Pressable
        style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        onPress={saveChecklist}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={theme.colors[appearance].buttonText}
          />
        ) : (
          <Text style={styles.submitButtonText}>
            {localized('Save Checklist')}
          </Text>
        )}
      </Pressable>
    </View>
  );
};

export default ChecklistScreen;