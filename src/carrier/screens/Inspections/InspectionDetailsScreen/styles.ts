import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    counterContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      gap: 10,
    },

    counterButton: {
      flex: 1,
      minHeight: 56,
      borderRadius: 14,
      paddingHorizontal: 10,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    selectedButton: {
      backgroundColor: colors.primaryForeground,
      borderColor: colors.primaryForeground,
    },

    counterButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryText,
    },

    counter: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '700',
      color: colors.secondaryText,
    },

    listContainer: {
      padding: 16,
      paddingBottom: 32,
    },

    titleHeader: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 16,
    },

    itemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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

    titleText: {
      fontSize: 15,
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
      justifyContent: 'center',
      alignItems: 'center',
    },

    buttonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },

    button: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 8,
    },

    boldText: {
      marginTop: 4,
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
    },

    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 40,
    },
  });
};

export default dynamicStyles;