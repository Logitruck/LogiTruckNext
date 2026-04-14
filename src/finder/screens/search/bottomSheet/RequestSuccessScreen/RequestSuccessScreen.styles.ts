import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      backgroundColor: colors.primaryBackground,
    },
    iconContainer: {
      marginBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15,
      color: colors.secondaryText,
      textAlign: 'center',
      marginBottom: 10,
      lineHeight: 22,
    },
    requestId: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      textAlign: 'center',
      marginBottom: 28,
    },
    buttonColumn: {
      width: '100%',
      gap: 12,
    },
    primaryButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryButton: {
      width: '100%',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
};