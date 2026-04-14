import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../core/dopebase';

const FinderSectionPlaceholder = ({ title }: { title: string }) => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primaryBackground,
      }}
    >
      <Text
        style={{
          color: colors.primaryText,
          fontSize: theme.fontSizes.l,
          fontWeight: theme.fontWeights.m,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

export default FinderSectionPlaceholder;