import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      marginBottom: 16,
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 10,
    },

    summaryCard: {
      borderRadius: 20,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: 8,
    },

    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    kpiItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
      paddingVertical: 4,
    },

    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.tertiaryBackground,
      marginBottom: 6,
    },

    value: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 2,
    },

    label: {
      fontSize: 11,
      color: colors.secondaryText,
      textAlign: 'center',
    },
  });
};

export default dynamicStyles;