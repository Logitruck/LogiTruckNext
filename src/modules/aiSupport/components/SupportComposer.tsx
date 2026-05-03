import React from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme, useTranslations } from '../../../core/dopebase';
import dynamicStyles from '../screens/SupportAssistantScreen/styles';


type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  loading?: boolean;
};

const SupportComposer = ({
  value,
  onChangeText,
  onSend,
  loading = false,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  return (
    <View style={styles.composerContainer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={localized('Ask for help')}
        placeholderTextColor={theme.colors[appearance].secondaryText}
        multiline
      />

      <Pressable
        style={[
          styles.sendButton,
          loading ? styles.sendButtonDisabled : null,
        ]}
        onPress={onSend}
        disabled={loading}
      >
        <Text style={styles.sendButtonText}>
          {localized('Send')}
        </Text>
      </Pressable>
    </View>
  );
};

export default SupportComposer;