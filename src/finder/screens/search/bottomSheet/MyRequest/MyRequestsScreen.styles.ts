import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 32,
      backgroundColor: colors.primaryBackground,
    },
    sectionContainer: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },
    listContent: {
      gap: 10,
    },
    card: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 14,
      padding: 14,
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
    cardStatus: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryText,
    },
    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      paddingVertical: 12,
    },
    loaderContainer: {
      paddingVertical: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};