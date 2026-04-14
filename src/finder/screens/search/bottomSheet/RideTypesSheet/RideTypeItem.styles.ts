import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderRadius: 12,
      marginBottom: 8,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: 74,
    },
    selectedItemContainer: {
      borderColor: colors.primaryForeground,
      backgroundColor: colors.primaryBackground,
    },
    image: {
      width: 52,
      height: 52,
      borderRadius: 10,
      backgroundColor: colors.grey3 || colors.secondaryBackground,
    },
    textContainer: {
      flex: 1,
      marginLeft: 12,
      marginRight: 8,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 2,
    },
    uses: {
      fontSize: 12,
      color: colors.secondaryText,
    },
  });
};