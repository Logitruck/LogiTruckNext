import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './CheckListReviewSection.styles';
import useReviewDocumentActions from '../../hooks/useReviewDocumentActions';

type CheckListReviewSectionProps = {
  request: any;
  documents: any[];
  onRefresh?: () => void;
};

const CheckListReviewSection = ({
  request,
  documents = [],
  onRefresh,
}: CheckListReviewSectionProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const { viewDocument, approveDocument, rejectDocument } =
    useReviewDocumentActions(request, onRefresh, localized);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.documentRow}>
      <View style={styles.docInfo}>
        <Text style={styles.docTitle}>
          {item.title || localized('Untitled document')}
        </Text>

        <Text style={styles.docStatus}>
          {localized('Status')}: {item.status || 'pending'}
        </Text>

        <Text style={styles.docSection}>
          {localized('Section')}: {item.checklistItemLabel || '—'}
        </Text>
      </View>

      <View style={styles.actionsContainer}>
        <Pressable
          onPress={() => viewDocument(item)}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons
            name="eye-outline"
            size={20}
            color={colors.primaryForeground}
          />
        </Pressable>

        {item.status !== 'approved' && (
          <Pressable
            onPress={() => approveDocument(item.id)}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={colors.green}
            />
          </Pressable>
        )}

        {item.status !== 'rejected' && (
          <Pressable
            onPress={() => rejectDocument(item.id)}
            style={styles.iconButton}
          >
            <MaterialCommunityIcons
              name="close-circle-outline"
              size={20}
              color={colors.red}
            />
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{localized('Checklist Review')}</Text>

      {documents?.length ? (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          scrollEnabled={false}
        />
      ) : (
        <Text style={styles.noDocuments}>
          {localized('No documents to review')}
        </Text>
      )}
    </View>
  );
};

export default CheckListReviewSection;