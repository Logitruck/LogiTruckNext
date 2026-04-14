import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';

type DocumentItem = {
  id: string;
  title?: string;
  status?: string;
  [key: string]: any;
};

type Props = {
  document: DocumentItem;
  onRemove?: (document: DocumentItem) => void;
  onSend?: (document: DocumentItem) => void;
  onView?: (document: DocumentItem) => void;
  onReplace?: (document: DocumentItem, newData: any) => Promise<void> | void;
};

const ChecklistItemRow = ({
  document,
  onRemove,
  onSend,
  onView,
  onReplace,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const renderActions = () => {
    switch (document.status) {
      case 'approved':
        return (
          <View style={styles.actionsContainer}>
            <Pressable onPress={() => onView?.(document)} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
          </View>
        );

      case 'rejected':
        return (
          <View style={styles.actionsContainer}>
            <Pressable onPress={() => onView?.(document)} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
            <Pressable onPress={() => onReplace?.(document, {})} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
          </View>
        );

      case 'sent':
        return (
          <View style={styles.actionsContainer}>
            <Pressable onPress={() => onView?.(document)} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
            <Pressable onPress={() => onReplace?.(document, {})} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="pencil-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
          </View>
        );

      default:
        return (
          <View style={styles.actionsContainer}>
            <Pressable onPress={() => onView?.(document)} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="eye-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
            <Pressable onPress={() => onRemove?.(document)} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
            <Pressable onPress={() => onSend?.(document)} style={styles.iconButton}>
              <MaterialCommunityIcons
                name="send-outline"
                size={20}
                color={theme.colors[appearance].primaryText}
              />
            </Pressable>
          </View>
        );
    }
  };

  return (
    <View style={styles.documentRow}>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>{document.title ?? '—'}</Text>
        <Text style={styles.docStatus}>
          {localized(document.status?.toUpperCase() || 'PENDING')}
        </Text>
      </View>

      {renderActions()}
    </View>
  );
};

export default ChecklistItemRow;