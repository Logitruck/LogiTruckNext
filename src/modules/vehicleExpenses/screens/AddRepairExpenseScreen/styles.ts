import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 16,
    },
    card: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    fieldGroup: {
      marginBottom: 14,
      flex: 1,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 12,
      color: colors.primaryText,
      fontSize: 15,
    },
    helperText: {
      marginTop: 6,
      fontSize: 12,
      color: colors.secondaryText,
    },
    summaryBox: {
      marginTop: 6,
      backgroundColor: colors.tertiaryBackground,
      borderRadius: 10,
      padding: 12,
    },
    summaryText: {
      color: colors.primaryText,
      fontSize: 14,
      marginBottom: 4,
    },
    button: {
      backgroundColor: colors.primaryForeground,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '700',
    },
  });
};

export default dynamicStyles;