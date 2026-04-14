import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    sectionContainer: {
      marginBottom: 20,
      paddingHorizontal: 16,
    },

    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
    },

    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: colors.primaryForeground,
    },

    newChatIcon: {
      color: colors.buttonText,
      marginRight: 6,
    },

    newChatText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.buttonText,
    },

    sectionContent: {
      borderRadius: 12,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },

    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      paddingVertical: 12,
    },
  });
};