import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../../../../core/dopebase';
import dynamicStyles from './styles';
import { FinderPriorityActionItem } from '../../../hooks/home/useFinderPriorityActions';

type Props = {
  item: FinderPriorityActionItem;
  loading?: boolean;
};

const getSeverityColor = (
  severity: 'low' | 'medium' | 'high',
  colors: any,
) => {
  switch (severity) {
    case 'high':
      return colors.red || '#dc2626';
    case 'medium':
      return '#f59e0b';
    default:
      return colors.primaryForeground;
  }
};

const FinderPriorityActionCard = ({ item, loading = false }: Props) => {
  const navigation = useNavigation<any>();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  const severityColor = getSeverityColor(item.severity, colors);

  const handlePress = () => {
    if (!item?.target?.routeName) return;
    navigation.navigate(item.target.routeName, item.target.params);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: severityColor }]}
      activeOpacity={0.9}
      onPress={handlePress}
    >
      <View style={styles.leftContent}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${severityColor}18` },
          ]}
        >
          <MaterialCommunityIcons
            name={item.icon}
            size={20}
            color={severityColor}
          />
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.helper}>Open now</Text>
        </View>
      </View>

      <View style={styles.rightContent}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.primaryForeground}
          />
        ) : (
          <>
            <Text style={[styles.count, { color: severityColor }]}>
              {item.count}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.secondaryText}
            />
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default FinderPriorityActionCard;