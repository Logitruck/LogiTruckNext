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
      borderRadius: 16,
      width: '90%',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 10,
      elevation: 10,
    },
    modalTitle: {
      fontWeight: '700',
      fontSize: 18,
      marginBottom: 16,
      color: colors.primaryText,
    },
    sectionLabel: {
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 6,
      color: colors.primaryText,
    },
    selectionItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.secondaryBackground,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectionItemSelected: {
      backgroundColor: '#e0f7e9',
      borderColor: '#2ecc71',
    },
    selectionText: {
      color: colors.primaryText,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 20,
    },
    cancelText: {
      marginRight: 24,
      color: colors.secondaryText,
    },
    confirmText: {
      color: '#2ecc71',
      fontWeight: '700',
    },
  });
};