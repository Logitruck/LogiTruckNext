import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../../../../core/dopebase';
import dynamicStyles from './styles';

type Props = {
  label: string;
  icon: string;
  color: string;
  onPress?: () => void;
};

const QuickActionCard = ({ label, icon, color, onPress }: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { borderColor: color }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>

      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default QuickActionCard;