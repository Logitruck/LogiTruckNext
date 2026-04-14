import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create({
    usersMentionContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colorSet.grey0,
      height: 4 * 64,
    },
    usersMentionScrollContainer: {
      flex: 1,
    },
    loaderContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};

export default dynamicStyles;