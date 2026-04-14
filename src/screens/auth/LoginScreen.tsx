import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../core/onboarding/hooks/useAuth';
import { useTheme, useTranslations } from '../../core/dopebase';
import { dynamicStyles } from './LoginScreen.styles';

const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { signIn } = useAuth();
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();

  const colors = theme.colors[appearance];
  const spaces = theme.spaces;
  const fontSizes = theme.fontSizes;
  const fontWeights = theme.fontWeights;

  const styles = dynamicStyles(colors, spaces, fontSizes, fontWeights, theme);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onPressLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert(
        localized('Error'),
        localized('Please enter email and password'),
      );
      return;
    }

    try {
      setLoading(true);

      await signIn(email.trim(), password.trim());

      Keyboard.dismiss();

    } catch (error: any) {
      Alert.alert(
        localized('Login failed'),
        error?.message ?? localized('Unknown error'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{localized('Sign In')}</Text>

      <TextInput
        style={styles.input}
        placeholder={localized('E-mail')}
        placeholderTextColor={colors.secondaryText}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder={localized('Password')}
        placeholderTextColor={colors.secondaryText}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={onPressLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? localized('Loading...') : localized('Log In')}
        </Text>
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator
          style={styles.loader}
          color={colors.primaryForeground}
        />
      )}
    </View>
  );
};

export default LoginScreen;