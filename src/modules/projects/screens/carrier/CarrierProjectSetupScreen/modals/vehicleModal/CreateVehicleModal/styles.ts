import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    innerContainer: {
      flex: 1,
      paddingHorizontal: 20,
    },

    scrollContent: {
      paddingBottom: 40,
    },

    modalTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primaryText,
      lineHeight: 30,
      marginBottom: 8,
    },

    helperText: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 20,
      marginBottom: 20,
    },

    label: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
      marginTop: 12,
    },

    input: {
      minHeight: 48,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primaryText,
    },

    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
    },

    primaryButton: {
      flex: 1,
      minHeight: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },

    primaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.buttonText,
    },
  });
};

export default dynamicStyles;