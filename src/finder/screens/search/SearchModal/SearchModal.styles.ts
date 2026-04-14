import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      paddingTop: 8,
    },

    navHeaderContainer: {
      backgroundColor: colors.primaryBackground,
    },

    autocompleteContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      zIndex: 10,
    },

    textInputContainer: {
      backgroundColor: 'transparent',
      borderTopWidth: 0,
      borderBottomWidth: 0,
      paddingHorizontal: 16,
    },

    textInput: {
      height: 52,
      borderRadius: 14,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.primaryText,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    separator: {
      height: 1,
      backgroundColor: colors.hairline,
      marginLeft: 56,
    },

    listView: {
      marginTop: 8,
      backgroundColor: colors.primaryBackground,
      borderTopWidth: 0,
    },

    circle: {
      position: 'absolute',
      top: 22,
      left: 28,
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.secondaryText,
      zIndex: 20,
    },

    line: {
      position: 'absolute',
      top: 36,
      left: 32.5,
      width: 1.5,
      height: 42,
      backgroundColor: colors.secondaryText,
      zIndex: 19,
    },

    square: {
      position: 'absolute',
      top: 77,
      left: 27,
      width: 12,
      height: 12,
      borderRadius: 3,
      backgroundColor: colors.secondaryText,
      zIndex: 20,
    },

    tintIndicator: {
      backgroundColor: colors.primaryForeground,
    },
  });
};