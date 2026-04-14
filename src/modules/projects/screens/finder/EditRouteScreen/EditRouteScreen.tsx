import React, { useEffect, useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import {
  getRouteByID,
  updateRoute,
  type ProjectRoute,
} from '../../../hooks/finder/useProjectRoutes';

type RouteFormData = {
  pickupAlias: string;
  dropoffAlias: string;
  pickupTime: string;
  pickupContact: string;
  dropoffContact: string;
  pickupInstructions: string;
  dropoffInstructions: string;
  pricePerTrip: string;
  tripsOffered: string;
  notes: string;
};

const EditRouteScreen = ({ route, navigation }: any) => {
  const {
    project,
    routeID,
    channelID: routeChannelID,
    projectID: routeProjectID,
  } = route.params || {};

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const channelID =
    routeChannelID ||
    project?.channelID ||
    `${project?.finderID}_${project?.vendorID}`;

  const projectID = routeProjectID || project?.id || project?.requestID;

  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<ProjectRoute | null>(null);

  const [formData, setFormData] = useState<RouteFormData>({
    pickupAlias: '',
    dropoffAlias: '',
    pickupTime: '',
    pickupContact: '',
    dropoffContact: '',
    pickupInstructions: '',
    dropoffInstructions: '',
    pricePerTrip: '',
    tripsOffered: '',
    notes: '',
  });

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Edit Route'),
      headerBackTitleVisible: false,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [navigation, appearance, localized, theme]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        if (!channelID || !projectID || !routeID) {
          throw new Error('Missing route identifiers');
        }

        const data: ProjectRoute | null = await getRouteByID(
          channelID,
          projectID,
          routeID,
        );

        if (data) {
          setRouteData(data);

          setFormData({
            pickupAlias: data.pickupAlias || '',
            dropoffAlias: data.dropoffAlias || '',
            pickupTime: data.pickupTime || '',
            pickupContact: data.pickupContact || '',
            dropoffContact: data.dropoffContact || '',
            pickupInstructions: data.pickupInstructions || '',
            dropoffInstructions: data.dropoffInstructions || '',
            pricePerTrip:
              data.pricePerTrip != null ? String(data.pricePerTrip) : '',
            tripsOffered:
              data.tripsOffered != null ? String(data.tripsOffered) : '',
            notes: data.notes || '',
          });
        }
      } catch (error) {
        console.error('❌ Error loading route:', error);
        Alert.alert(
          localized('Error'),
          localized('Failed to load route data.'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
  }, [channelID, projectID, routeID, localized]);

  const handleChange = (field: keyof RouteFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      if (!channelID || !projectID || !routeID) {
        throw new Error('Missing route identifiers');
      }

      await updateRoute(channelID, projectID, routeID, {
        pickupAlias: formData.pickupAlias,
        dropoffAlias: formData.dropoffAlias,
        pickupTime: formData.pickupTime,
        pickupContact: formData.pickupContact,
        dropoffContact: formData.dropoffContact,
        pickupInstructions: formData.pickupInstructions,
        dropoffInstructions: formData.dropoffInstructions,
        pricePerTrip:
          formData.pricePerTrip.trim() !== ''
            ? Number(formData.pricePerTrip)
            : 0,
        tripsOffered:
          formData.tripsOffered.trim() !== ''
            ? Number(formData.tripsOffered)
            : 0,
        notes: formData.notes,
      });

      Alert.alert(
        localized('Success'),
        localized('Route updated successfully.'),
      );

      navigation.goBack();
    } catch (error) {
      console.error('❌ Error updating route:', error);
      Alert.alert(
        localized('Error'),
        localized('Failed to update route.'),
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
        <Text style={styles.loadingText}>
          {localized('Loading route...')}
        </Text>
      </View>
    );
  }

  const fields: Array<{
    label: string;
    field: keyof RouteFormData;
    multiline?: boolean;
    keyboardType?: 'default' | 'numeric' | 'number-pad' | 'decimal-pad';
  }> = [
    { label: 'Pickup Alias', field: 'pickupAlias' },
    { label: 'Dropoff Alias', field: 'dropoffAlias' },
    { label: 'Pickup Time', field: 'pickupTime' },
    { label: 'Pickup Contact', field: 'pickupContact' },
    { label: 'Dropoff Contact', field: 'dropoffContact' },
    {
      label: 'Price per Trip',
      field: 'pricePerTrip',
      keyboardType: Platform.OS === 'ios' ? 'decimal-pad' : 'numeric',
    },
    {
      label: 'Trips Offered',
      field: 'tripsOffered',
      keyboardType: Platform.OS === 'ios' ? 'number-pad' : 'numeric',
    },
    {
      label: 'Notes',
      field: 'notes',
      multiline: true,
    },
    {
      label: 'Pickup Instructions',
      field: 'pickupInstructions',
      multiline: true,
    },
    {
      label: 'Dropoff Instructions',
      field: 'dropoffInstructions',
      multiline: true,
    },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.header}>{localized('Edit Route')}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>
            {routeData?.origin?.title || '-'} → {routeData?.destination?.title || '-'}
          </Text>

          <Text style={styles.summaryText}>
            {localized('Trips')}: {routeData?.tripsOffered ?? routeData?.cargo?.trips ?? '-'}
          </Text>

          <Text style={styles.summaryText}>
            {localized('Price per Trip')}:{' '}
            {routeData?.pricePerTrip != null ? `$${routeData.pricePerTrip}` : '-'}
          </Text>
        </View>

        {fields.map(({ label, field, multiline, keyboardType }) => (
          <View key={field} style={styles.inputGroup}>
            <Text style={styles.label}>{localized(label)}</Text>

            <TextInput
              style={[styles.input, multiline ? styles.multiline : null]}
              value={formData[field]}
              onChangeText={(text) => handleChange(field, text)}
              multiline={multiline}
              numberOfLines={multiline ? 4 : 1}
              keyboardType={keyboardType || 'default'}
              placeholder={localized(`Enter ${label.toLowerCase()}`)}
              placeholderTextColor={theme.colors[appearance].secondaryText}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        ))}

        <Pressable style={styles.saveButton} onPress={handleSave}>
          <MaterialCommunityIcons
            name="content-save"
            size={20}
            color="white"
          />
          <Text style={styles.saveButtonText}>
            {localized('Save Route')}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditRouteScreen;