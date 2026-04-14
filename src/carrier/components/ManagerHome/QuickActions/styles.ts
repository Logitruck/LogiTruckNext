import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      marginBottom: 4,
    },
    grid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    card: {
      flex: 1,
      minHeight: 88,
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconContainer: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryText,
      textAlign: 'center',
      lineHeight: 17,
    },
  });
};

export default dynamicStyles;