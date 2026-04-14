import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    fullContainer: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    fixedHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 6,
      backgroundColor: colors.primaryBackground,
    },
    scrollContainer: {
      paddingHorizontal: 16,
      paddingBottom: 180,
      paddingTop: 12,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
      marginTop: 12,
    },
    input: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primaryText,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateInputContainer: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    dateInputText: {
      fontSize: 15,
      color: colors.primaryText,
    },
    textArea: {
      minHeight: 110,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    primaryButton: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 14,
      fontWeight: '600',
    },
  });
};