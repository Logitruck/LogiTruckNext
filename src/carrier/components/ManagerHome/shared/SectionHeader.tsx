import React from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '../../../../core/dopebase';

type Props = {
  title: string;
  subtitle?: string;
};

const SectionHeader = ({ title, subtitle }: Props) => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <View style={{ marginBottom: 12 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.primaryText,
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{
            fontSize: 13,
            color: colors.secondaryText,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

export default SectionHeader;