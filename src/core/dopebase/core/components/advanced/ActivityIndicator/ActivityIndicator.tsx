import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { UIActivityIndicator } from 'react-native-indicators';

import { useTheme } from '../../../theming';
import dynamicStyles from './styles';

type Props = {
  text?: string;
};

const ActivityIndicatorComponent: React.FC<Props> = ({ text }) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <View style={styles.container}>
      <View style={styles.indicatorContainer}>
        <UIActivityIndicator
          color="#f5f5f5"
          size={30}
          animationDuration={400}
        />

        {text && text.length > 0 ? (
          <Text style={styles.text}>{text}</Text>
        ) : null}
      </View>
    </View>
  );
};

export const ActivityIndicator = memo(ActivityIndicatorComponent);