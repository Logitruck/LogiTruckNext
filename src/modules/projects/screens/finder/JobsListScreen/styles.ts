import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: '#000000aa',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      backgroundColor: colors.primaryBackground,
      padding: 20,
      borderRadius: 12,
      width: '85%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalLabel: {
      marginTop: 10,
      marginBottom: 6,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },
    dateInputContainer: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    dateInputText: {
      fontSize: 15,
      color: colors.primaryText,
    },
    notesInput: {
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 6,
      borderRadius: 8,
      color: colors.primaryText,
      backgroundColor: colors.secondaryBackground,
      minHeight: 90,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 16,
    },
    cancelText: {
      color: colors.secondaryText,
      fontSize: 14,
    },
    confirmText: {
      color: colors.primaryForeground,
      fontWeight: '700',
      fontSize: 14,
    },
  });
};