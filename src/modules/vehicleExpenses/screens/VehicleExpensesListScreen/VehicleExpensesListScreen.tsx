import React from 'react';
import { View } from 'react-native';
import dynamicStyles from './styles';
import { useTheme } from '../../../../core/dopebase';

const VehicleExpensesListScreen = () => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return <View style={styles.container} />;
};

export default VehicleExpensesListScreen;
