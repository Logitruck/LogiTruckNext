import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
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
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
      gap: 12,
    },
    card: {
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    cardHeaderTextBlock: {
      flex: 1,
      marginRight: 12,
    },
    projectName: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryForeground,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    routeText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      lineHeight: 20,
    },
    metaText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 4,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 30,
      fontSize: 14,
      color: colors.secondaryText,
    },
  });
};

export default dynamicStyles;