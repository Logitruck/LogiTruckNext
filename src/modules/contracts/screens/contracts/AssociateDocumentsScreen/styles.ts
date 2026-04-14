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
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContainer: {
      paddingBottom: 16,
      gap: 12,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardSelected: {
      borderColor: colors.primaryForeground,
      borderWidth: 2,
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
    },
    emptyText: {
      textAlign: 'center',
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 40,
    },
    bottomLoader: {
      marginTop: 16,
    },
    button: {
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
      marginTop: 16,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.buttonText,
    },
  });
};