import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useTranslations } from '../../../../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useCreateCarrierVehicle from '../../../../../../hooks/carrier/useCreateCarrierVehicle';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorID: string;
  type: 'Truck' | 'Trailer';
  onCreated?: (vehicle: any) => void;
};

const CreateVehicleModal = ({
  visible,
  onClose,
  vendorID,
  type,
  onCreated,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const insets = useSafeAreaInsets();

  const { createVehicle } = useCreateCarrierVehicle();

  const [number, setNumber] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [name, setName] = useState('');
  const [vin, setVin] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setNumber('');
    setLicensePlate('');
    setName('');
    setVin('');
    setMake('');
    setModel('');
    setYear('');
    setSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = async () => {
    try {
      const cleanNumber = number.trim();
      const cleanPlate = licensePlate.trim();

      if (!cleanNumber || !cleanPlate) {
        Alert.alert(
          localized('Validation'),
          localized('Unit number and license plate are required'),
        );
        return;
      }

      setSaving(true);

      const created = await createVehicle({
        vendorID,
        type,
        number: cleanNumber,
        licensePlate: cleanPlate,
        name,
        vin,
        make,
        model,
        year,
      });

      onCreated?.(created);
      handleClose();
    } catch (error: any) {
      Alert.alert(
        localized('Error'),
        error?.message || localized('Could not create vehicle'),
      );
    } finally {
      setSaving(false);
    }
  };

  const modalTitle =
    type === 'Truck'
      ? localized('Add Truck')
      : localized('Add Trailer');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.innerContainer,
              { paddingTop: Math.max(insets.top, 12) },
            ]}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>{modalTitle}</Text>

              <Text style={styles.helperText}>
                {localized(
                  'Create the vehicle with the minimum operational data required for inspections.',
                )}
              </Text>

              <Text style={styles.label}>{localized('Unit Number')}</Text>
              <TextInput
                style={styles.input}
                value={number}
                onChangeText={setNumber}
                placeholder={localized('Ex: 104 or TR-22')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('License Plate')}</Text>
              <TextInput
                style={styles.input}
                value={licensePlate}
                onChangeText={setLicensePlate}
                autoCapitalize="characters"
                placeholder={localized('Enter license plate')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('Display Name')}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={localized('Optional alias for the unit')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('VIN')}</Text>
              <TextInput
                style={styles.input}
                value={vin}
                onChangeText={setVin}
                autoCapitalize="characters"
                placeholder={localized('Optional VIN')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('Make')}</Text>
              <TextInput
                style={styles.input}
                value={make}
                onChangeText={setMake}
                placeholder={localized('Ex: Freightliner')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('Model')}</Text>
              <TextInput
                style={styles.input}
                value={model}
                onChangeText={setModel}
                placeholder={localized('Ex: Cascadia')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('Year')}</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                keyboardType="numeric"
                placeholder={localized('Ex: 2022')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <View style={styles.modalActions}>
                <Pressable style={styles.secondaryButton} onPress={handleClose}>
                  <Text style={styles.secondaryButtonText}>
                    {localized('Cancel')}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.primaryButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>
                    {saving ? localized('Saving...') : localized('Save')}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

export default CreateVehicleModal;