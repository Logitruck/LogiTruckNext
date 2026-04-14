import React from 'react';
import { TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../dopebase';
import { dynamicStyles } from './MenuIconButton.styles';

type Props = {
  onPress: () => void;
  source?: any;
  withShadow?: boolean;
};

const MenuIconButton = ({ onPress, source, withShadow }: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, withShadow && styles.shadowBackground]}
    >
      <Image
        style={styles.icon}
        source={source ?? theme.icons.menu}
        resizeMode="contain"
      />
    </TouchableOpacity>
  );
};

export default MenuIconButton;