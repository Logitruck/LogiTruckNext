import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Image,
  Pressable,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import { useUploadJobTicketImage } from '../../../hooks/useUploadJobTicketImage';
import useUpdateJobTripStatus from '../../../hooks/useUpdateJobTripStatus';
import useTripTracking from '../../../hooks/useTripTracking';
import { getFunctions, httpsCallable } from 'firebase/functions';
type TicketType = 'pickup' | 'delivery';

type TicketCaptureRouteParams = {
  type: TicketType;
  jobID: string;
  projectID: string;
  channelID: string;
  driverID?: string;
};

type CapturedImage = {
  uri: string;
  width?: number;
  height?: number;
  fileName?: string | null;
  mimeType?: string | null;
};

const TicketCaptureScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const {
    type,
    jobID,
    projectID,
    channelID,
    driverID,
  } = route.params as TicketCaptureRouteParams;

  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const [image, setImage] = useState<CapturedImage | null>(null);
  const [loading, setLoading] = useState(false);

  const { uploadTicketImage } = useUploadJobTicketImage(channelID, projectID);
  const { updateTripStatus } = useUpdateJobTripStatus(channelID, projectID);
  const { finalizeTripAndSaveToFirestore } = useTripTracking({
    shouldTrack: false,
    jobID,
    channelID,
    projectID,
  });

  const functions = getFunctions();
const processJobTicket = httpsCallable(functions, 'processJobTicket');
  useLayoutEffect(() => {
    navigation.setOptions({
      title:
        type === 'pickup'
          ? localized('Pickup Ticket')
          : localized('Delivery Ticket'),
      headerBackTitleVisible: false,
      headerShown: true,
      headerStyle: {
        backgroundColor: theme.colors[appearance].primaryBackground,
      },
      headerTitleStyle: {
        color: theme.colors[appearance].primaryText,
      },
      headerTintColor: theme.colors[appearance].primaryText,
    });
  }, [navigation, type, theme, appearance, localized]);

  const handleCapture = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        allowsEditing: true,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];

        setImage({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          fileName: asset.fileName ?? null,
          mimeType: asset.mimeType ?? null,
        });
      }
    } catch (error: any) {
      Alert.alert(
        localized('Error'),
        error?.message || localized('Unable to select image.'),
      );
    }
  };

const handleSave = async () => {
  if (!image?.uri) return;

  try {
    setLoading(true);

    const uploadResult = await uploadTicketImage(jobID, image.uri, type);

    if (!uploadResult?.url) {
      throw new Error('Ticket image upload did not return a URL');
    }

    try {
      await processJobTicket({
        channelID,
        projectID,
        jobID,
        ticketType: type,
        imageUrl: uploadResult.url,
      });
    } catch (processingError) {
      console.log('⚠️ Ticket AI processing failed:', processingError);
    }

    if (type === 'pickup') {
      await updateTripStatus(jobID, 'en_route_to_dropoff');

      Alert.alert(
        localized('Success'),
        localized('Pickup ticket uploaded'),
      );

      navigation.goBack();
      return;
    }

    if (type === 'delivery') {
      await finalizeTripAndSaveToFirestore();
      await updateTripStatus(jobID, 'completed', driverID || null);

      Alert.alert(
        localized('Success'),
        localized('Delivery completed'),
      );

      navigation.reset({
        index: 0,
        routes: [{ name: 'DriverMain' }],
      });
    }
  } catch (error: any) {
    Alert.alert(
      localized('Upload Error'),
      error?.message || localized('Unable to upload ticket.'),
    );
  } finally {
    setLoading(false);
  }
};

  const handleRetake = () => {
    setImage(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentCard}>
          <Text style={styles.title}>
            {type === 'pickup'
              ? localized('Pickup Ticket')
              : localized('Delivery Ticket')}
          </Text>

          <Text style={styles.subtitle}>
            {type === 'pickup'
              ? localized(
                  'Select the ticket image for pickup confirmation.',
                )
              : localized(
                  'Select the ticket image for delivery confirmation.',
                )}
          </Text>

          {!image?.uri ? (
            <Pressable
              style={[styles.captureButton, styles.captureButtonVisible]}
              onPress={handleCapture}
            >
              <Text style={styles.captureButtonText}>
                {localized('Select Ticket Image')}
              </Text>
            </Pressable>
          ) : (
            <>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />

              <View style={styles.actionsColumn}>
                <Pressable style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>
                    {localized('Save Ticket')}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.secondaryButton}
                  onPress={handleRetake}
                >
                  <Text style={styles.secondaryButtonText}>
                    {localized('Choose Another')}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default TicketCaptureScreen;