import React from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
} from 'react-native';
import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';
import ChecklistItemRow from '../checkListItemRow/CheckListItemRow';

type DocumentItem = {
  id: string;
  [key: string]: any;
};

type Props = {
  sectionTitle: string;
  documents?: DocumentItem[];
  onAddDocument: (sectionTitle: string) => void;
  onViewDocument?: (document: DocumentItem) => void;
  onRemoveDocument?: (document: DocumentItem) => void;
  onSendDocument?: (document: DocumentItem) => void;
  onReplaceDocument?: (document: DocumentItem, newData: any) => Promise<void> | void;
};

const ChecklistSection = ({
  sectionTitle,
  documents = [],
  onAddDocument,
  onViewDocument,
  onRemoveDocument,
  onSendDocument,
  onReplaceDocument,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{sectionTitle}</Text>

        <Pressable onPress={() => onAddDocument(sectionTitle)}>
          <Text style={styles.addButton}>{localized('Add Document')}</Text>
        </Pressable>
      </View>

      {documents.length > 0 ? (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChecklistItemRow
              document={item}
              onRemove={onRemoveDocument}
              onSend={onSendDocument}
              onView={onViewDocument}
              onReplace={onReplaceDocument}
            />
          )}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.noDocuments}>
          {localized('No documents added')}
        </Text>
      )}
    </View>
  );
};

export default ChecklistSection;