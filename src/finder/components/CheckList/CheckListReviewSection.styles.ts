import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      marginTop: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 10,
    },
    documentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 12,
      marginBottom: 10,
    },
    docInfo: {
      flex: 1,
      paddingRight: 12,
    },
    docTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },
    docStatus: {
      fontSize: 12,
      color: colors.secondaryText,
      marginBottom: 2,
    },
    docSection: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
    },
    noDocuments: {
      fontSize: 14,
      color: colors.secondaryText,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });
};