import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 16,
    },
    headerMenuButton: {
      marginLeft: 16,
    },
  });
};

export default dynamicStyles;