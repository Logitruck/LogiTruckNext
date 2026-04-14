import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    list: {
      gap: 10,
    },
    card: {
      minHeight: 86,
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 5,
      paddingHorizontal: 14,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: 12,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    textBlock: {
      flex: 1,
    },
    label: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 2,
    },
    helper: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    rightContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    count: {
      fontSize: 20,
      fontWeight: '700',
    },
  });
};

export default dynamicStyles;