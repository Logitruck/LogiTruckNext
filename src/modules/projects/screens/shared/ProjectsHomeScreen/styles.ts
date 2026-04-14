import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContainer: {
      padding: 16,
      paddingBottom: 24,
    },
    card: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
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
      color: colors.primaryText,
      marginBottom: 4,
    },
    cardMeta: {
      fontSize: 13,
      color: colors.secondaryText,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      color: colors.secondaryText,
      fontSize: 14,
    },
    
  });
};