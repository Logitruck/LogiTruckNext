import { StyleSheet } from 'react-native';

const NAV_ICON_SIZE = 50;

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: 10,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: 25,
      height: NAV_ICON_SIZE,
      width: NAV_ICON_SIZE,
    },
    shadowBackground: {
      left: 20,
      backgroundColor: colors.primaryBackground,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.34,
      shadowRadius: 6.27,
      elevation: 10,
    },
    icon: {
      height: Math.floor(NAV_ICON_SIZE * 0.4),
      width: Math.floor(NAV_ICON_SIZE * 0.4),
      tintColor: colors.secondaryForeground,
    },
  });
};