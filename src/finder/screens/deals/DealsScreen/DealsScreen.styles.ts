import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 12,
      backgroundColor: colorSet.primaryBackground,
    },
    card: {
      backgroundColor: colorSet.secondaryBackground,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colorSet.primaryText,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colorSet.secondaryText,
      marginTop: 4,
    },
    cardMeta: {
      fontSize: 12,
      color: colorSet.secondaryText,
      marginTop: 4,
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
      color: colorSet.secondaryText,
      marginTop: 40,
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    listContainer: {
      paddingBottom: 20,
    },
  });
};