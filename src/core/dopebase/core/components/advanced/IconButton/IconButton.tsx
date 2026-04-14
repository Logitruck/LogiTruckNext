import React from 'react';
import {
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  StyleProp,
  ViewStyle,
  ImageStyle,
} from 'react-native';

type IconButtonProps = {
  tintColor?: string;
  onPress?: () => void;
  source: ImageSourcePropType;
  marginRight?: number;
  width?: number;
  height?: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function IconButton({
  tintColor,
  onPress,
  source,
  marginRight,
  width,
  height,
  containerStyle,
  imageStyle,
}: IconButtonProps) {
  return (
    <TouchableOpacity
      style={[{ marginRight }, containerStyle]}
      onPress={onPress}
    >
      <Image
        style={[{ width, height, tintColor }, imageStyle]}
        source={source}
      />
    </TouchableOpacity>
  );
}