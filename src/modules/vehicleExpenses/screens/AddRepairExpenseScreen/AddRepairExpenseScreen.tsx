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

const parsePositiveNumber = (value: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const AddRepairExpenseScreen = ({ navigation, route }: any) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const currentUser = useCurrentUser();

  const { saveRepair, loading } = useSaveVehicleExpense(localized);

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
  const inspectionID = route?.params?.inspectionID || null;
  const initialCorrectedItemLabel = route?.params?.correctedItemLabel || '';

  const [repairCategory, setRepairCategory] = useState('general');
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [partsAmount, setPartsAmount] = useState('');
  const [laborAmount, setLaborAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [correctedItemLabel, setCorrectedItemLabel] = useState(
    initialCorrectedItemLabel,
  );
  const [notes, setNotes] = useState('');

  const partsAmountNumber = useMemo(
    () => parsePositiveNumber(partsAmount),
    [partsAmount],
  );
  const laborAmountNumber = useMemo(
    () => parsePositiveNumber(laborAmount),
    [laborAmount],
  );
  const totalAmountNumber = useMemo(
    () => parsePositiveNumber(totalAmount),
    [totalAmount],
  );

  const calculatedTotal = useMemo(() => {
    const parts = partsAmountNumber || 0;
    const labor = laborAmountNumber || 0;
    const total = parts + labor;
    return total > 0 ? Math.round(total * 100) / 100 : null;
  }, [partsAmountNumber, laborAmountNumber]);

  useLayoutEffect(() => {
    const colors = theme.colors[appearance];

    navigation.setOptions({
      headerShown: true,
      title: localized('Add Repair'),
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

      const finalAmount = totalAmountNumber || calculatedTotal;

      if (!finalAmount) {
        Alert.alert(localized('Error'), localized('Enter valid total amount'));
        return;
      }

      await saveRepair({
        vendorID,
        vehicleID,
        vehicleType,
        amount: finalAmount,
        repairCategory,
        vendorName,
        invoiceNumber,
        partsAmount: partsAmountNumber,
        laborAmount: laborAmountNumber,
        correctedItemLabel,
        notes,
        jobID,
        projectID,
        channelID,
        inspectionID,
        createdBy: {
          userID: currentUser?.id || currentUser?.userID || '',
          firstName: currentUser?.firstName || '',
          lastName: currentUser?.lastName || '',
          email: currentUser?.email || '',
        },
      });

      Alert.alert(localized('Success'), localized('Repair expense saved'));
      navigation.goBack();
    } catch (error) {
      console.error('🔥 Error in AddRepairExpenseScreen:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>{localized('Repair Expense')}</Text>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Vehicle')}</Text>
          <Text style={styles.helperText}>
            {vehicleType}: {vehicleID || '—'}
          </Text>
        </View>

        {inspectionID ? (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{localized('Inspection')}</Text>
            <Text style={styles.helperText}>{inspectionID}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Repair Category')}</Text>
          <TextInput
            style={styles.input}
            value={repairCategory}
            onChangeText={setRepairCategory}
            placeholder={localized('Enter category')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Vendor / Shop')}</Text>
          <TextInput
            style={styles.input}
            value={vendorName}
            onChangeText={setVendorName}
            placeholder={localized('Enter vendor name')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Invoice Number')}</Text>
          <TextInput
            style={styles.input}
            value={invoiceNumber}
            onChangeText={setInvoiceNumber}
            placeholder={localized('Enter invoice number')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{localized('Corrected Item')}</Text>
          <TextInput
            style={styles.input}
            value={correctedItemLabel}
            onChangeText={setCorrectedItemLabel}
            placeholder={localized('Optional corrected item')}
            placeholderTextColor={theme.colors[appearance].secondaryText}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{localized('Parts')}</Text>
            <TextInput
              style={styles.input}
              value={partsAmount}
              onChangeText={setPartsAmount}
              placeholder="0.00"
              placeholderTextColor={theme.colors[appearance].secondaryText}
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>{localized('Labor')}</Text>
            <TextInput
              style={styles.input}
              value={laborAmount}
              onChangeText={setLaborAmount}
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
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholder="0.00"
            placeholderTextColor={theme.colors[appearance].secondaryText}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryText}>
            {localized('Calculated Total')}: {calculatedTotal ?? '—'}
          </Text>
          <Text style={styles.summaryText}>
            {localized('Final Total')}: {totalAmountNumber || calculatedTotal || '—'}
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
          <Text style={styles.buttonText}>{localized('Save Repair Expense')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddRepairExpenseScreen;