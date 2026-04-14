import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
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
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },
    loadingText: {
      marginTop: 10,
      fontSize: 14,
      color: colors.primaryText,
    },
    header: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 16,
    },
    inputGroup: {
      marginBottom: 14,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
    },
    summaryCard: {
  marginBottom: 16,
  padding: 14,
  borderRadius: 14,
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

summaryTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 8,
},

summaryText: {
  fontSize: 13,
  color: colors.secondaryText,
  marginTop: 4,
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
    multiline: {
      minHeight: 110,
      textAlignVertical: 'top',
    },
    saveButton: {
      marginTop: 12,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colors.primaryForeground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
  });
};