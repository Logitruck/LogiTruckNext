import React from 'react';
import { Text, TouchableHighlight, View, Image, ImageSourcePropType, StyleProp, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../dopebase';
import { dynamicStyles } from './styles';

type Props = {
  title: string;
  source?: string | ImageSourcePropType;
  onPress: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

const IMMenuButton = ({ title, source, onPress, containerStyle }: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const renderIcon = () => {
    if (typeof source === 'string') {
      return (
        <MaterialCommunityIcons
          name={source}
          size={24}
          color={theme.colors[appearance].primaryText}
          style={{ marginRight: 20 }}
        />
      );
    }

    if (typeof source === 'number') {
      return (
        <Image
          source={source}
          style={[
            styles.btnIcon,
            { tintColor: theme.colors[appearance].primaryText },
          ]}
        />
      );
    }

    return null;
  };

  return (
    <TouchableHighlight
      onPress={onPress}
      style={[styles.btnClickContain, containerStyle]}
      underlayColor={styles.btnClickContain.backgroundColor}
    >
      <View style={styles.btnContainer}>
        {renderIcon()}
        <Text style={styles.btnText}>{title}</Text>
      </View>
    </TouchableHighlight>
  );
};

export default IMMenuButton;