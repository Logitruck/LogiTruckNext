import React, { memo } from 'react';
import {
  TouchableOpacity,
  Image,
  Text,
  View,
  TextInput,
  Button,
} from 'react-native';

import { useTheme } from '../../dopebase';
import dynamicStyles from './styles';

type SearchBarAlternateProps = {
  onPress?: () => void;
  placeholderTitle?: string;
  onChangeText?: (text: string) => void;
  onSearchBarCancel?: () => void;
  value?: string;
};

const SearchBarAlternate = memo(function SearchBarAlternate(
  props: SearchBarAlternateProps,
) {
  const {
    onPress,
    placeholderTitle,
    onChangeText,
    onSearchBarCancel,
    value,
  } = props;

  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const searchIcon = require('../../../assets/icons/search.png');

  // 🔹 Modo input (cuando hay onChangeText)
  if (onChangeText) {
    return (
      <View style={styles.searchBoxContainer}>
        <View style={[styles.container, { borderRadius: 9 }]}>
          <Image style={styles.searchIcon} source={searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholderTitle}
            onChangeText={onChangeText}
            value={value}
          />
        </View>

        <Button
          onPress={onSearchBarCancel}
          title="Cancel"
        />
      </View>
    );
  }

  // 🔹 Modo botón (solo display)
  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPress={onPress}
    >
      <Image style={styles.searchIcon} source={searchIcon} />
      <Text style={styles.searchInput}>{placeholderTitle}</Text>
    </TouchableOpacity>
  );
});

export default SearchBarAlternate;