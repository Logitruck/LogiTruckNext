import React from 'react';
import {
  TouchableOpacity,
  Image,
  Text,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
  TextStyle,
  ViewStyle,
  LayoutChangeEvent,
} from 'react-native';
import { useTheme } from '../../..';
import dynamicStyles from './styles';

type TouchableIconProps = {
  onPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  iconSource: ImageSourcePropType;
  imageStyle?: StyleProp<ImageStyle>;
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  renderTitle?: boolean;
  onLongPress?: () => void;
  onPressOut?: () => void;
  onPressIn?: () => void;
  iconRef?: React.Ref<any>;
  onLayout?: (event: LayoutChangeEvent) => void;
  disabled?: boolean;
};

export const TouchableIcon = ({
  onPress,
  containerStyle,
  iconSource,
  imageStyle,
  title,
  titleStyle,
  renderTitle,
  onLongPress,
  onPressOut,
  onPressIn,
  iconRef,
  onLayout,
  disabled = false,
}: TouchableIconProps) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <TouchableOpacity
      disabled={disabled}
      ref={iconRef}
      onLayout={onLayout}
      style={[styles.headerButtonContainer, containerStyle]}
      onLongPress={onLongPress}
      onPressOut={onPressOut}
      onPressIn={onPressIn}
      onPress={onPress}
    >
      <Image style={[styles.Image, imageStyle]} source={iconSource} />
      {renderTitle ? (
        <Text style={[styles.title, titleStyle]}>{title}</Text>
      ) : null}
    </TouchableOpacity>
  );
};