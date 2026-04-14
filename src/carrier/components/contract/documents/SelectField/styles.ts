import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
      marginTop: 8,
    },
    field: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    valueText: {
      fontSize: 15,
      color: colors.primaryText,
    },
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      padding: 16,
    },
    sheet: {
      maxHeight: '70%',
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sheetTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },
    optionRow: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionRowSelected: {
      borderColor: colors.primaryForeground,
    },
    optionText: {
      fontSize: 15,
      color: colors.primaryText,
    },
    optionTextSelected: {
      fontWeight: '600',
      color: colors.primaryText,
    },
    closeButton: {
      marginTop: 12,
      minHeight: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    closeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.buttonText,
    },
  });
};