import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.primaryBackground,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 16,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    input: {
      flex: 1,
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
    addButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    addButtonText: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.buttonText,
      lineHeight: 24,
    },
    listContainer: {
      paddingBottom: 16,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      marginBottom: 10,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    itemText: {
      flex: 1,
      fontSize: 15,
      color: colors.primaryText,
      paddingRight: 12,
    },
    removeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    removeText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 24,
    },
    submitButton: {
      minHeight: 50,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
      marginTop: 'auto',
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.buttonText,
    },
  });
};