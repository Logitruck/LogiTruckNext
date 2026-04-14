import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: colors.hairline,
    },
    closeText: {
      color: colors.primaryForeground,
      fontWeight: '600',
      fontSize: 16,
    },
    title: {
      fontSize: 17,
      fontWeight: '600',
      color: colors.primaryText,
    },
    searchContainer: {
      backgroundColor: colors.secondaryBackground,
      margin: 16,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      fontSize: 16,
      color: colors.primaryText,
    },
    item: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: colors.hairline,
    },
    itemTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.primaryText,
    },
    itemSubtitle: {
      fontSize: 14,
      color: colors.grey6,
      marginTop: 2,
    },
    centeredContent: {
      padding: 20,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
    },
  });
};