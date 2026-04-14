import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    sectionContainer: {
      marginBottom: 16,
      padding: 14,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },

    addButton: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryForeground,
    },

    noDocuments: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 6,
    },
  });
};