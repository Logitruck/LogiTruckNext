import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    headerMenuButton: {
      marginLeft: 16,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
    },
    listContainer: {
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.secondaryText,
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 13,
      color: colors.secondaryText,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 15,
      color: colors.secondaryText,
      marginTop: 40,
    },
  });
};