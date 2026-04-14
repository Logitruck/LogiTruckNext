import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useVendorVehicles from '../../../../../../hooks/carrier/useVendorVehicles';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorID: string;
  type: 'Truck' | 'Trailer';
  excludedIDs?: string[];
  onSelect: (vehicle: any) => void;
};

const getVehicleLabel = (item: any) => {
  const primary =
    item?.number?.trim() ||
    item?.name?.trim() ||
    item?.licensePlate?.trim() ||
    item?.id ||
    '-';

  const secondary = item?.licensePlate?.trim();

  if (secondary && secondary !== primary) {
    return `${primary} • ${secondary}`;
  }

  return primary;
};

const getVehicleMeta = (item: any) => {
  const meta = [item?.make, item?.model, item?.year].filter(Boolean);
  if (meta.length > 0) return meta.join(' • ');
  return item?.operationalStatus || 'pending';
};

const SelectExistingVehicleModal = ({
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

  const { trucks, trailers, loading } = useVendorVehicles(vendorID);
  const [search, setSearch] = useState('');

  const sourceItems = type === 'Truck' ? trucks : trailers;

  const filteredItems = useMemo(() => {
    const cleanSearch = search.trim().toLowerCase();

    return sourceItems.filter((item: any) => {
      if (excludedIDs.includes(item.id)) return false;

      if (!cleanSearch) return true;

      const haystack = [
        item?.number,
        item?.name,
        item?.licensePlate,
        item?.vin,
        item?.make,
        item?.model,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(cleanSearch);
    });
  }, [sourceItems, excludedIDs, search]);

  const modalTitle =
    type === 'Truck'
      ? localized('Select Existing Truck')
      : localized('Select Existing Trailer');

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
            placeholder={localized('Search by unit, plate, VIN, make or model')}
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
                    <Text style={styles.cardTitle}>{getVehicleLabel(item)}</Text>
                    <Text style={styles.cardMeta}>{getVehicleMeta(item)}</Text>
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
                    {localized('No available vehicles found')}
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

export default SelectExistingVehicleModal;