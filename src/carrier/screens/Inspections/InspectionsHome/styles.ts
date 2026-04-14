import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    listContainer: {
      padding: 16,
      paddingBottom: 32,
    },

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      marginBottom: 12,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    itemDetails: {
      flex: 1,
      paddingRight: 12,
    },
    sectionHeaderContainer: {
  marginHorizontal: 16,
  marginTop: 8,
  marginBottom: 6,
},

sectionHeaderText: {
  fontSize: 18,
  fontWeight: '700',
  color: colors.primaryText,
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
      marginTop: 2,
      lineHeight: 18,
    },

    iconContainer: {
      minWidth: 82,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    buttonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    button: {
      minWidth: 68,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    boldText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryText,
      marginTop: 4,
      textAlign: 'center',
    },

    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 40,
      paddingHorizontal: 24,
    },
  });
};

export default dynamicStyles;