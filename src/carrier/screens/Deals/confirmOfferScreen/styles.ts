import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },
    content: {
      width: '100%',
      maxWidth: 400,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
      marginBottom: 24,
    },
    button: {
      width: '100%',
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.buttonText,
    },
  });
};