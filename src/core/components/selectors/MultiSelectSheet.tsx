import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../../dopebase';

type SelectItem = {
  id: string;
  [key: string]: any;
};

type Props<T extends SelectItem> = {
  title: string;
  items?: T[];
  selectedItems?: T[];
  onConfirm: (items: T[]) => void;
  onClose?: () => void;
  getLabel?: (item: T) => string;
};

const MultiSelectSheet = <T extends SelectItem>({
  title,
  items = [],
  selectedItems = [],
  onConfirm,
  onClose,
  getLabel = (item) => String(item.id),
}: Props<T>) => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  const [localSelected, setLocalSelected] = useState<T[]>(selectedItems);

  const selectedIds = useMemo(
    () => new Set(localSelected.map((item) => item.id)),
    [localSelected]
  );

  const toggleItem = (item: T) => {
    const exists = selectedIds.has(item.id);

    if (exists) {
      setLocalSelected((prev) =>
        prev.filter((selected) => selected.id !== item.id)
      );
    } else {
      setLocalSelected((prev) => [...prev, item]);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.primaryBackground,
      }}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: colors.primaryBackground,
        }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              fontSize: 24,
              fontWeight: '700',
              color: colors.primaryText,
              flex: 1,
              marginRight: 12,
            }}
          >
            {title}
          </Text>

          {!!onClose && (
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={colors.primaryText}
              />
            </Pressable>
          )}
        </View>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 120,
            flexGrow: items.length === 0 ? 1 : 0,
          }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingTop: 40,
              }}
            >
              <Text
                style={{
                  fontSize: 15,
                  color: colors.secondaryText,
                  textAlign: 'center',
                }}
              >
                No items available
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const selected = selectedIds.has(item.id);

            return (
              <Pressable
                onPress={() => toggleItem(item)}
                style={{
                  padding: 14,
                  borderRadius: 14,
                  marginBottom: 10,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected
                    ? colors.primaryForeground
                    : colors.border,
                  backgroundColor: colors.secondaryBackground,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: '500',
                    color: colors.primaryText,
                    marginRight: 12,
                  }}
                >
                  {getLabel(item)}
                </Text>

                <MaterialCommunityIcons
                  name={selected ? 'check-circle' : 'circle-outline'}
                  size={22}
                  color={
                    selected
                      ? colors.primaryForeground
                      : colors.secondaryText
                  }
                />
              </Pressable>
            );
          }}
        />

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.primaryBackground,
            flexDirection: 'row',
            gap: 12,
          }}
        >
          {!!onClose && (
            <Pressable
              onPress={onClose}
              style={{
                flex: 1,
                minHeight: 52,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.secondaryBackground,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.primaryText,
                }}
              >
                Cancel
              </Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => onConfirm(localSelected)}
            style={{
              flex: 1,
              minHeight: 52,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primaryForeground,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: '#fff',
              }}
            >
              Confirm
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MultiSelectSheet;