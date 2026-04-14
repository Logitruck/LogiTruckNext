import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../../../../core/dopebase';
import dynamicStyles from './styles';

type Props = {
  label: string;
  value: number;
  icon: string;
  color: string;
  loading?: boolean;
  onPress?: () => void;
};

const InspectionStatusCard = ({
  label,
  value,
  icon,
  color,
  loading = false,
  onPress,
}: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[styles.card, { borderColor: color }]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}18` }]}>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>

        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.primaryForeground}
          />
        ) : (
          <Text style={[styles.value, { color }]}>{value}</Text>
        )}
      </View>

      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

export default InspectionStatusCard;