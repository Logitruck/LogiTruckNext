import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, useTranslations } from '../../../../../../../core/dopebase';
import { dynamicStyles } from './styles';
import useCreateCarrierPersonnel from '../../../../../hooks/carrier/useCreateCarrierPersonnel';

type Props = {
  visible: boolean;
  onClose: () => void;
  vendorID: string;
  role: 'driver' | 'dispatch';
  onCreated?: (person: any) => void;
};

const CreatePersonnelModal = ({
  visible,
  onClose,
  vendorID,
  role,
  onCreated,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const insets = useSafeAreaInsets();

  const { createPersonnel } = useCreateCarrierPersonnel();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const resetState = () => {
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setEmail('');
    setSaving(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSave = async () => {
    try {
      const cleanFirstName = firstName.trim();
      const cleanLastName = lastName.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanPhoneNumber = phoneNumber.trim();

      if (!cleanFirstName) {
        throw new Error(localized('First name is required'));
      }

      if (!cleanEmail) {
        throw new Error(localized('Email is required'));
      }

      setSaving(true);

      const created = await createPersonnel({
        vendorID,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        phoneNumber: cleanPhoneNumber,
        email: cleanEmail,
        rolesArray: [role],
      });

      onCreated?.(created.person);

      Alert.alert(
        localized('Success'),
        created?.isNewAuthUser
          ? localized(
              'User created successfully. Temporary password: Temp1234!',
            )
          : localized(
              'Existing user linked or updated successfully for this company.',
            ),
      );

      handleClose();
    } catch (error: any) {
      Alert.alert(
        localized('Error'),
        error?.message || localized('Could not create person'),
      );
    } finally {
      setSaving(false);
    }
  };

  const modalTitle =
    role === 'driver'
      ? localized('Add Driver')
      : localized('Add Dispatcher');

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
                  'This will create or link a user account for this company with a temporary password.',
                )}
              </Text>

              <Text style={styles.label}>{localized('First Name')}</Text>
              <TextInput
                style={styles.input}
                value={firstName}
                onChangeText={setFirstName}
                placeholder={localized('Enter first name')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('Last Name')}</Text>
              <TextInput
                style={styles.input}
                value={lastName}
                onChangeText={setLastName}
                placeholder={localized('Enter last name')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
              />

              <Text style={styles.label}>{localized('Phone')}</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder={localized('Enter phone')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>{localized('Email')}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={localized('Enter email')}
                placeholderTextColor={theme.colors[appearance].secondaryText}
                autoCapitalize="none"
                keyboardType="email-address"
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

export default CreatePersonnelModal;