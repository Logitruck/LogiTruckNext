import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useProjectChecklist, {
  ProjectChecklistAssignedTo,
  ProjectChecklistCategory,
  ProjectChecklistStatus,
} from '../../../hooks/shared/useProjectChecklist';

const CATEGORIES: ProjectChecklistCategory[] = [
  'document',
  'operation',
  'compliance',
  'route',
  'resource',
];

const ASSIGNEES: ProjectChecklistAssignedTo[] = [
  'finder',
  'carrier',
  'driver',
  'dispatcher',
];

const STATUSES: ProjectChecklistStatus[] = [
  'pending',
  'submitted',
  'approved',
  'rejected',
  'not_required',
];

const ProjectChecklistScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { project } = route.params || {};

  const channelID = project?.channelID;
  const projectID = project?.id;

  const { items, loading, createItem, updateItemStatus, deleteItem } =
    useProjectChecklist(channelID, projectID);

  const routes = useMemo(
    () => (Array.isArray(project?.routes) ? project.routes : []),
    [project?.routes],
  );

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProjectChecklistCategory>('document');
  const [assignedTo, setAssignedTo] = useState<ProjectChecklistAssignedTo>('carrier');
  const [required, setRequired] = useState(true);
  const [routeID, setRouteID] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: localized('Project Checklist'),
    });
  }, [navigation, localized]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert(localized('Error'), localized('Title is required'));
      return;
    }

    try {
      setSaving(true);

      await createItem({
        title,
        category,
        required,
        routeID,
        assignedTo,
        notes,
      });

      setTitle('');
      setCategory('document');
      setAssignedTo('carrier');
      setRequired(true);
      setRouteID(null);
      setNotes('');
    } catch (error) {
      console.error('❌ Error creating checklist item:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not create checklist item'),
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemID: string) => {
    try {
      await deleteItem(itemID);
    } catch (error) {
      console.error('❌ Error deleting checklist item:', error);
      Alert.alert(
        localized('Error'),
        localized('Could not delete checklist item'),
      );
    }
  };

  const getRouteLabel = (routeItem: any, index: number) => {
    return `${localized('Route')} ${index + 1}: ${
      routeItem?.origin?.title || localized('Unknown origin')
    } → ${routeItem?.destination?.title || localized('Unknown destination')}`;
  };

  const getStatusStyle = (status: ProjectChecklistStatus) => {
    switch (status) {
      case 'approved':
        return styles.statusApproved;
      case 'submitted':
        return styles.statusSubmitted;
      case 'rejected':
        return styles.statusRejected;
      case 'not_required':
        return styles.statusMuted;
      default:
        return styles.statusPending;
    }
  };

return (
  <SafeAreaView style={styles.container}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{localized('New Checklist Item')}</Text>

          <Text style={styles.label}>{localized('Title')}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={localized('Ex: Pickup permit confirmed')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />

          <Text style={styles.label}>{localized('Category')}</Text>
          <View style={styles.chipsRow}>
            {CATEGORIES.map((item) => (
              <Pressable
                key={item}
                style={[
                  styles.chip,
                  category === item ? styles.chipSelected : null,
                ]}
                onPress={() => setCategory(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    category === item ? styles.chipTextSelected : null,
                  ]}
                >
                  {localized(item)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{localized('Assigned To')}</Text>
          <View style={styles.chipsRow}>
            {ASSIGNEES.map((item) => (
              <Pressable
                key={item || 'none'}
                style={[
                  styles.chip,
                  assignedTo === item ? styles.chipSelected : null,
                ]}
                onPress={() => setAssignedTo(item)}
              >
                <Text
                  style={[
                    styles.chipText,
                    assignedTo === item ? styles.chipTextSelected : null,
                  ]}
                >
                  {localized(item || 'unassigned')}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{localized('Route (optional)')}</Text>
          <View style={styles.chipsColumn}>
            <Pressable
              style={[styles.chip, routeID === null ? styles.chipSelected : null]}
              onPress={() => setRouteID(null)}
            >
              <Text
                style={[
                  styles.chipText,
                  routeID === null ? styles.chipTextSelected : null,
                ]}
              >
                {localized('Project Level')}
              </Text>
            </Pressable>

            {routes.map((routeItem: any, index: number) => (
              <Pressable
                key={routeItem?.id || index}
                style={[
                  styles.chip,
                  routeID === routeItem.id ? styles.chipSelected : null,
                ]}
                onPress={() => setRouteID(routeItem.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    routeID === routeItem.id ? styles.chipTextSelected : null,
                  ]}
                >
                  {getRouteLabel(routeItem, index)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{localized('Notes')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder={localized('Optional details')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />

          <Pressable
            style={[
              styles.toggleButton,
              required ? styles.toggleButtonActive : null,
            ]}
            onPress={() => setRequired((prev) => !prev)}
          >
            <Text style={styles.toggleButtonText}>
              {required ? localized('Required') : localized('Optional')}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.primaryButton, saving ? styles.disabledButton : null]}
            onPress={handleCreate}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? localized('Saving...') : localized('Add Item')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{localized('Checklist Items')}</Text>

          {loading ? (
            <ActivityIndicator
              size="large"
              color={theme.colors[appearance].primaryForeground}
            />
          ) : items.length === 0 ? (
            <Text style={styles.emptyText}>
              {localized('No checklist items yet')}
            </Text>
          ) : (
            items.map((item: any) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{item.title}</Text>

                  <Pressable onPress={() => handleDelete(item.id)}>
                    <Text style={styles.deleteText}>✕</Text>
                  </Pressable>
                </View>

                <Text style={styles.itemMeta}>
                  {localized('Category')}: {localized(item.category)}
                </Text>

                <Text style={styles.itemMeta}>
                  {localized('Assigned To')}: {localized(item.assignedTo || 'unassigned')}
                </Text>

                <Text style={styles.itemMeta}>
                  {localized('Required')}: {item.required ? localized('Yes') : localized('No')}
                </Text>

                <Text style={styles.itemMeta}>
                  {localized('Route')}:{' '}
                  {item.routeID
                    ? routes.find((routeItem: any) => routeItem.id === item.routeID)?.origin?.title ||
                      item.routeID
                    : localized('Project Level')}
                </Text>

                {item.notes ? (
                  <Text style={styles.itemMeta}>
                    {localized('Notes')}: {item.notes}
                  </Text>
                ) : null}

                <View style={styles.statusRow}>
                  {STATUSES.map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.statusChip,
                        status === item.status ? getStatusStyle(status) : null,
                      ]}
                      onPress={() => updateItemStatus(item.id, status)}
                    >
                      <Text style={styles.statusChipText}>
                        {localized(status)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
};

export default ProjectChecklistScreen;