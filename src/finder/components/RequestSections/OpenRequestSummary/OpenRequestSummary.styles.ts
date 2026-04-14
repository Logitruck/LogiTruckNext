import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    card: {
      backgroundColor: colors.secondaryBackground,
      padding: 16,
      borderRadius: 10,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primaryText,
      marginBottom: 6,
    },
    label: {
      fontSize: 14,
      marginTop: 4,
      color: colors.primaryText,
    },
  });
};