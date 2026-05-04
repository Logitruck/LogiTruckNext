import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../../onboarding/hooks/useAuth';
import { useTranslations, useTheme } from '../../../dopebase';
import { useUpdateUserProfile } from '../../hooks/useUpdateUserProfile';
import { dynamicStyles } from './styles';

const ROLE_LABELS: Record<string, string> = {
  carrier: 'Carrier',
  dispatch: 'Carrier',
  dispatcher: 'Carrier',
  driver: 'Driver',
  finder: 'Shipper',
};

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
];

const MyProfileScreen = () => {
  const navigation = useNavigation<any>();
  const { currentUser, activeRole } = useAuth();
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];
  const { loading, error, updateProfile } = useUpdateUserProfile();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('PROFILE'),
      headerStyle: { backgroundColor: colors.primaryBackground },
      headerTintColor: colors.primaryText,
      headerShadowVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          style={{ marginLeft: 16 }}
        >
          <MaterialCommunityIcons name="menu" size={24} color={colors.primaryText} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, localized]);

  const [firstName, setFirstName] = useState<string>(currentUser?.firstName ?? '');
  const [lastName, setLastName] = useState<string>(currentUser?.lastName ?? '');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    currentUser?.preferredLanguage ?? 'en',
  );

  const roleLabel = ROLE_LABELS[activeRole ?? ''] ?? activeRole ?? '';

  const handleSave = () => {
    updateProfile({ firstName, lastName, preferredLanguage: selectedLanguage });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>{localized('PROFILE_INFO')}</Text>

      <Text style={styles.label}>{localized('FIRST_NAME')}</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder={localized('FIRST_NAME')}
        placeholderTextColor={styles.placeholder.color as string}
      />

      <Text style={styles.label}>{localized('LAST_NAME')}</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder={localized('LAST_NAME')}
        placeholderTextColor={styles.placeholder.color as string}
      />

      <Text style={styles.label}>{localized('EMAIL')}</Text>
      <Text style={styles.readOnly}>{currentUser?.email ?? ''}</Text>

      <Text style={styles.label}>{localized('ROLE')}</Text>
      <Text style={styles.readOnly}>{roleLabel}</Text>

      <Text style={styles.sectionTitle}>{localized('LANGUAGE')}</Text>
      <View style={styles.languageRow}>
        {LANGUAGES.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageButton,
              selectedLanguage === lang.code && styles.languageButtonActive,
            ]}
            onPress={() => setSelectedLanguage(lang.code)}
          >
            <Text
              style={[
                styles.languageButtonText,
                selectedLanguage === lang.code && styles.languageButtonTextActive,
              ]}
            >
              {lang.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error.message}</Text>}

      <TouchableOpacity
        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>{localized('SAVE_CHANGES')}</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MyProfileScreen;
