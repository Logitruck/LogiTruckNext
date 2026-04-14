import React, { useLayoutEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../../../core/dopebase';
import { useCurrentUser } from '../../../../core/onboarding/hooks/useAuth';
import dynamicStyles from './styles';
import useSaveVehicleExpense from '../../hooks/useSaveVehicleExpense';
import { FuelType } from '../../types';

const parsePositiveNumber = (value: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const AddFuelExpenseScreen = ({ navigation, route }: any) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const currentUser = useCurrentUser();

  const { saveFuel, loading } = useSaveVehicleExpense(localized);

  const vendorID =
    route?.params?.vendorID ||
    currentUser?.activeVendorID ||
    currentUser?.vendorID ||
    null;

  const vehicleID = route?.params?.vehicleID || null;
  const vehicleType = route?.params?.vehicleType || 'Truck';
  const jobID = route?.params?.jobID || null;
  const projectID = route?.params?.projectID || null;
  const channelID = route?.params?.channelID || null;

  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [stationName, setStationName] = useState('');
  const [odometerReading, setOdometerReading] = useState('');
  const [gallons, setGallons] = useState('');
  const [pricePerGallon, setPricePerGallon] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const gallonsNumber = useMemo(() => parsePositiveNumber(gallons), [gallons]);
  const priceNumber = useMemo(
    () => parsePositiveNumber(pricePerGallon),
    [pricePerGallon],
  );
  const amountNumber = useMemo(() => parsePositiveNumber(amount), [amount]);

  const calculatedAmount = useMemo(() => {
    if (!gallonsNumber || !priceNumber) {
      return null;
    }
    return Math.round(gallonsNumber * priceNumber * 100) / 100;
  }, [gallonsNumber, priceNumber]);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Add Fuel'),
      headerBackTitleVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ marginLeft: 16 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={colors.primaryText}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, localized, theme, appearance]);

  const handleSave = async () => {
    try {
      if (!vendorID) {
        Alert.alert(localized('Error'), localized('Missing vendor'));
        return;
      }

      if (!vehicleID) {
        Alert.alert(localized('Error'), localized('Missing vehicle'));
        return;
      }

      const finalGallons = gallonsNumber;
      const finalPricePerGallon = priceNumber;
      const finalAmount = amountNumber || calculatedAmount;

      if (!finalGallons) {
        Alert.alert(localized('Error'), localized('Enter valid gallons'));
        return;
      }

      if (!finalPricePerGallon) {
        Alert.alert(localized('Error'), localized('Enter valid price per gallon'));
        return;
      }

      if (!finalAmount) {
        Alert.alert(localized('Error'), localized('Enter valid total amount'));
        return;
      }

      await saveFuel({
        vendorID,
        vehicleID,
        vehicleType,
        amount: finalAmount,
        gallons: finalGallons,
        pricePerGallon: finalPricePerGallon,
        fuelType,
        stationName,
        odometerReading,
        notes,
        jobID,
        projectID,
        channelID,
        createdBy: {
          userID: currentUser?.id || currentUser?.userID || '',
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || '',
          email: currentUser?.email || '',
        },
      });

      Alert.alert(localized('Success'), localized('Fuel expense saved'));

      navigation.goBack();
    } catch (error) {
      console.error('🔥 Error in AddFuelExpenseScreen:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{localized('Fuel Expense')}</Text>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Vehicle')}</Text>
          <Text style={styles.helperText}>
            {vehicleType}: {vehicleID || '—'}
          </Text>
        </View>

        {jobID ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{localized('Linked Job')}</Text>
            <Text style={styles.helperText}>{jobID}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Fuel Type')}</Text>
          <View style={styles.segmentedRow}>
            {(['diesel', 'gasoline', 'def'] as FuelType[]).map(type => {
              const isActive = fuelType === type;

              return (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    isActive && styles.typeButtonActive,
                  ]}
                  onPress={() => setFuelType(type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      isActive && styles.typeButtonTextActive,
                    ]}
                  >
                    {localized(type)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Station Name')}</Text>
          <TextInput
            style={styles.input}
            value={stationName}
            onChangeText={setStationName}
            placeholder={localized('Enter station name')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Odometer')}</Text>
          <TextInput
            style={styles.input}
            value={odometerReading}
            onChangeText={setOdometerReading}
            placeholder={localized('Enter odometer reading')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{localized('Gallons')}</Text>
            <TextInput
              style={styles.input}
              value={gallons}
              onChangeText={setGallons}
              placeholder="0.00"
              placeholderTextColor={theme.colors[appearance].secondaryText}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{localized('Price/Gallon')}</Text>
            <TextInput
              style={styles.input}
              value={pricePerGallon}
              onChangeText={setPricePerGallon}
              placeholder="0.00"
              placeholderTextColor={theme.colors[appearance].secondaryText}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Total Amount')}</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={theme.colors[appearance].secondaryText}
            keyboardType="decimal-pad"
          />
          <Text style={styles.helperText}>
            {localized('You can enter the total manually or let it be calculated.')}
          </Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            {localized('Calculated Total')}: {calculatedAmount ?? '—'}
          </Text>
          <Text style={styles.summaryText}>
            {localized('Final Total')}: {amountNumber || calculatedAmount || '—'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Notes')}</Text>
          <TextInput
            style={styles.input}
            value={notes}
            onChangeText={setNotes}
            placeholder={localized('Optional notes')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
            multiline
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.colors[appearance].buttonText} />
        ) : (
          <Text style={styles.buttonText}>{localized('Save Fuel Expense')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddFuelExpenseScreen;