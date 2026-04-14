import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    summaryBox: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 10,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
      backgroundColor: colors.card || colors.primaryBackground,
    },

    summaryRow: {
      marginBottom: 10,
    },

    summaryLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondaryText,
      marginBottom: 2,
    },

    summaryValue: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
    },

    pdfContainer: {
      flex: 1,
      marginHorizontal: 12,
      marginBottom: 12,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: colors.card || colors.primaryBackground,
    },

    pdf: {
      flex: 1,
      width: '100%',
      height: '100%',
      backgroundColor: colors.primaryBackground,
    },

    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },

    infoText: {
      marginTop: 10,
      fontSize: 14,
      color: colors.secondaryText,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      backgroundColor: colors.primaryBackground,
    },

    emptyTitle: {
      marginTop: 12,
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
    },

    emptyText: {
      marginTop: 8,
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
    },
  });
};

export default dynamicStyles;