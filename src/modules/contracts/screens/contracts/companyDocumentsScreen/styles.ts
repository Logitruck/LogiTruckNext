import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    tabContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 8,
    },
    tabItem: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabItemActive: {
      backgroundColor: colors.primaryForeground,
      borderColor: colors.primaryForeground,
    },
    tabText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryText,
    },
    tabTextActive: {
      color: colors.buttonText,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContainer: {
      padding: 16,
      paddingBottom: 32,
      gap: 12,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 4,
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 40,
    },
  });
};