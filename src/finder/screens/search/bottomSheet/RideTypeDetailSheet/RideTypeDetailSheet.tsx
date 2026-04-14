import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Image } from 'expo-image';
import { useIsFocused } from '@react-navigation/native';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import {
  setbottomSheetSnapPoints,
  setOrigin,
  setDestination,
  setSelectedRide,
} from '../../../../../redux';
import { dynamicStyles } from './RideTypeDetailSheet.styles';

const screenHeight = Dimensions.get('window').height;
const FIXED_HEIGHT = screenHeight * 0.32;

type Props = {
  route: any;
  navigation: any;
};

const formatETA = (seconds: number | string | null | undefined) => {
  const value = Number(seconds);
  if (!value) return '—';

  const minutes = Math.round(value / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${remainingMinutes} min`;
};

const formatDistance = (meters: number | string | null | undefined) => {
  const value = Number(meters);
  if (!value) return '—';

  const miles = value / 1609.34;
  return `${miles.toFixed(1)} mi`;
};

const RideTypeDetailSheet = ({ route, navigation }: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const ride = route?.params?.ride;
  const isFocused = useIsFocused();
  const dispatch = useDispatch();

  const dropoffETA = useSelector((state: any) => state.trip?.dropoffETA);
  const dropoffDistance = useSelector((state: any) => state.trip?.dropoffDistance);

  useEffect(() => {
    if (isFocused) {
      dispatch(
        setbottomSheetSnapPoints({
          key: 'ride_detail',
          snapPoints: [FIXED_HEIGHT, FIXED_HEIGHT],
          index: 0,
        })
      );
    }
  }, [dispatch, isFocused]);

  const handleConfirm = () => {
    dispatch(setSelectedRide(ride));
    navigation.navigate('CargoDetailSheet');
  };

  const handleGoBack = () => {
    dispatch(setOrigin(null));
    dispatch(setDestination(null));
    navigation.navigate('HomeSheet');
  };

  return (
    <BottomSheetView style={[styles.container, { height: FIXED_HEIGHT }]}>
      <View style={styles.imageCard}>
        {ride?.photo ? (
          <Image
            style={styles.image}
            source={{ uri: ride.photo }}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>
              {localized('No image')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {ride?.title ?? localized('Selected category')}
        </Text>

        {!!ride?.description && (
          <Text style={styles.description}>{ride.description}</Text>
        )}

        <Text style={styles.metaText}>
          {localized('ETA')}: {formatETA(dropoffETA)} • {localized('Distance')}:{' '}
          {formatDistance(dropoffDistance)}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable onPress={handleGoBack} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>
            {localized('Edit route')}
          </Text>
        </Pressable>

        <Pressable onPress={handleConfirm} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {localized('Continue')}
          </Text>
        </Pressable>
      </View>
    </BottomSheetView>
  );
};

export default React.memo(RideTypeDetailSheet);