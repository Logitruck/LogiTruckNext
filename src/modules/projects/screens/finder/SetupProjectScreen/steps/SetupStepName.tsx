import React, { useEffect } from 'react';
import { View, TextInput, Text } from 'react-native';

import { useTheme, useTranslations } from '../../../../../../core/dopebase';
import { dynamicStepStyles } from './styles';

type Props = {
  data: any;
  setData: React.Dispatch<React.SetStateAction<any>>;
  onValidationChange: (value: boolean) => void;
};

const SetupStepName = ({
  data,
  setData,
  onValidationChange,
}: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStepStyles(theme, appearance);

  const name = data?.name ?? '';

  useEffect(() => {
    onValidationChange(name.trim().length > 2);
  }, [name, onValidationChange]);

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.label}>{localized('Project Name')}</Text>

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(value) =>
          setData((prev: any) => ({
            ...prev,
            name: value,
          }))
        }
        placeholder={localized('Ex: South Florida Multi-Route Project')}
        placeholderTextColor={theme.colors[appearance].secondaryText}
      />

      <Text style={styles.helperText}>
        {localized('This name will be used to identify the accepted project package.')}
      </Text>
    </View>
  );
};

export default SetupStepName;