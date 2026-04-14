import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../../core/dopebase';
import { dynamicStyles } from './RideTypeItem.styles';

type Props = {
  item: any;
  onPress: (item: any) => void;
  isSelected: boolean;
  dropoffETA?: any;
  dropoffDistance?: any;
};

const RideTypeItem = ({ item, onPress, isSelected }: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const colors = theme.colors[appearance];

  return (
    <Pressable
      onPress={() => onPress(item)}
      style={[styles.container, isSelected && styles.selectedItemContainer]}
    >
      <Image
        style={styles.image}
        source={item?.photo ? { uri: item.photo } : undefined}
        contentFit="cover"
      />

      <View style={styles.textContainer}>
        <Text style={styles.title}>{item?.title ?? '—'}</Text>
        <Text style={styles.uses}>{item?.uses ?? ''}</Text>
      </View>

      {isSelected && (
        <Ionicons
          name="arrow-forward-circle"
          size={24}
          color={colors.primaryForeground}
        />
      )}
    </Pressable>
  );
};

export default RideTypeItem;