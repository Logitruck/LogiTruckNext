import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      marginBottom: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
    },
  });
};

export default dynamicStyles;