import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../../../../core/dopebase';
import { dynamicStyles } from './styles';

const DriverJobsScreen = () => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Jobs</Text>
    </View>
  );
};

export default DriverJobsScreen;