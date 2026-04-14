import React, { useCallback, useState, useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useDispatch, useSelector } from 'react-redux';

import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './CargoDetailSheet.styles';
import {
  setbottomSheetSnapPoints,
  setCargoDetails,
  addRouteToPackage,
  resetTripState,
} from '../../../../../redux';

type Props = {
  navigation: any;
};

const CargoDetailSheet = ({ navigation }: Props) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const dispatch = useDispatch();

  const origin = useSelector((state: any) => state.trip?.origin);
  const destination = useSelector((state: any) => state.trip?.destination);
  const routeSummary = useSelector((state: any) => state.trip?.summaryTrip);
  const rideType = useSelector((state: any) => state.ride?.selectedRide);

  const [trips, setTrips] = useState('');
  const [dailyTrips, setDailyTrips] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [description, setDescription] = useState('');

  const [isStartVisible, setStartVisible] = useState(false);
  const [isEndVisible, setEndVisible] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const FIXED_HEIGHT = screenHeight * 0.58;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch(
        setbottomSheetSnapPoints({
          key: 'cargo_detail',
          snapPoints: [FIXED_HEIGHT, FIXED_HEIGHT],
          index: 0,
        })
      );
    }
  }, [dispatch, isFocused]);

  const onSave = useCallback(() => {
    if (!trips || Number.isNaN(Number(trips)) || parseInt(trips, 10) <= 0) {
      Alert.alert(
        localized('Required Field'),
        localized('Please enter the number of trips.')
      );
      return;
    }

    if (
      !dailyTrips ||
      Number.isNaN(Number(dailyTrips)) ||
      parseInt(dailyTrips, 10) <= 0
    ) {
      Alert.alert(
        localized('Required Field'),
        localized('Please enter daily trips.')
      );
      return;
    }

    if (!description.trim()) {
      Alert.alert(
        localized('Required Field'),
        localized('Please describe the cargo.')
      );
      return;
    }

    if (endDate < startDate) {
      Alert.alert(
        localized('Invalid Date'),
        localized('End date cannot be before start date.')
      );
      return;
    }

    const cargoData = {
      trips: parseInt(trips, 10),
      dailyTrips: parseInt(dailyTrips, 10),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      description: description.trim(),
    };

    dispatch(setCargoDetails(cargoData));

    dispatch(
      addRouteToPackage({
        id: `route_${Date.now()}`,
        origin,
        destination,
        routeSummary,
        rideType,
        cargo: cargoData,
      })
    );

    dispatch(resetTripState());

    navigation.navigate('HomeSheet');
  }, [
    trips,
    dailyTrips,
    startDate,
    endDate,
    description,
    dispatch,
    navigation,
    localized,
    origin,
    destination,
    routeSummary,
    rideType,
  ]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.fullContainer}
    >
      <View style={styles.fixedHeader}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{localized('Back')}</Text>
        </Pressable>

        <Pressable onPress={onSave} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>
            {localized('Add Route')}
          </Text>
        </Pressable>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>{localized('Number of Trips')}</Text>
        <TextInput
          style={styles.input}
          value={trips}
          onChangeText={setTrips}
          keyboardType="numeric"
          placeholder={localized('e.g. 5')}
          placeholderTextColor={theme.colors[appearance].secondaryText}
        />

        <Text style={styles.label}>{localized('Daily Trips')}</Text>
        <TextInput
          style={styles.input}
          value={dailyTrips}
          onChangeText={setDailyTrips}
          keyboardType="numeric"
          placeholder={localized('e.g. 1')}
          placeholderTextColor={theme.colors[appearance].secondaryText}
        />

        <Text style={styles.label}>{localized('Start Date')}</Text>
        <Pressable
          onPress={() => setStartVisible(true)}
          style={styles.dateInputContainer}
        >
          <Text style={styles.dateInputText}>{startDate.toDateString()}</Text>
        </Pressable>

        <DateTimePickerModal
          isVisible={isStartVisible}
          mode="date"
          onConfirm={(date) => {
            setStartDate(date);
            setStartVisible(false);
          }}
          onCancel={() => setStartVisible(false)}
        />

        <Text style={styles.label}>{localized('End Date')}</Text>
        <Pressable
          onPress={() => setEndVisible(true)}
          style={styles.dateInputContainer}
        >
          <Text style={styles.dateInputText}>{endDate.toDateString()}</Text>
        </Pressable>

        <DateTimePickerModal
          isVisible={isEndVisible}
          mode="date"
          onConfirm={(date) => {
            setEndDate(date);
            setEndVisible(false);
          }}
          onCancel={() => setEndVisible(false)}
        />

        <Text style={styles.label}>{localized('Cargo Description')}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
          placeholder={localized('What are you transporting?')}
          placeholderTextColor={theme.colors[appearance].secondaryText}
          textAlignVertical="top"
        />
      </BottomSheetScrollView>
    </KeyboardAvoidingView>
  );
};

export default React.memo(CargoDetailSheet);