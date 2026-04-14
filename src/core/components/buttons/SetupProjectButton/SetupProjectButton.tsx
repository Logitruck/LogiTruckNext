import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme, useTranslations } from '../../../dopebase';
import { styles } from './SetupProjectButton.styles';

type Props = {
  onPress: () => void;
};

const SetupProjectButton = ({ onPress }: Props) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();

  const colors = theme.colors[appearance];

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, { backgroundColor: colors.primaryForeground }]}
        onPress={onPress}
      >
        <MaterialCommunityIcons
          name="briefcase-edit-outline"
          size={20}
          color={colors.foregroundContrast}
        />

        <Text style={[styles.text, { color: colors.foregroundContrast }]}>
          {localized('Setup Project')}
        </Text>
      </Pressable>
    </View>
  );
};

export default SetupProjectButton;

