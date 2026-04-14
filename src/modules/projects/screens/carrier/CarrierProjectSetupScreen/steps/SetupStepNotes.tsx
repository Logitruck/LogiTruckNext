import React, { useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';

type Props = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onValidationChange: (value: boolean) => void;
};

const SetupStepNotes = ({
  data,
  setData,
  onValidationChange,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const notes = data?.carrierNotes ?? '';

  useEffect(() => {
    onValidationChange(true);
  }, [onValidationChange]);

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>
        {localized('Operational Notes (optional)')}
      </Text>

      <TextInput
        style={[styles.input, styles.textArea]}
        value={notes}
        onChangeText={(value) =>
          setData((prev: any) => ({
            ...prev,
            carrierNotes: value,
          }))
        }
        placeholder={localized(
          'Logistical observations, operational details...',
        )}
        placeholderTextColor={theme.colors[appearance].secondaryText}
        multiline
      />
    </View>
  );
};

export default SetupStepNotes;