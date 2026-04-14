import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'stretch',
      justifyContent: 'space-between',
      gap: 10,
    },
    card: {
      flex: 1,
      minHeight: 86,
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 12,
      justifyContent: 'space-between',
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    iconContainer: {
      width: 34,
      height: 34,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    value: {
      fontSize: 22,
      fontWeight: '700',
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.secondaryText,
      lineHeight: 15,
    },
  });
};

export default dynamicStyles;