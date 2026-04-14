import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    listContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 32,
    },

    emptyText: {
      marginTop: 32,
      textAlign: 'center',
      color: colors.secondaryText,
      fontSize: 15,
    },

    sectionHeaderContainer: {
      marginTop: 16,
      marginBottom: 8,
      paddingHorizontal: 4,
    },

    sectionHeaderText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
    },

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.hairline,
    },

    itemDetails: {
      flex: 1,
      paddingRight: 12,
    },

    titleText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
    },

    subtitleText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 4,
      lineHeight: 18,
    },

    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    button: {
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 4,
      minWidth: 72,
    },

    boldText: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
    },
  });
};

export default dynamicStyles;