import { StyleSheet } from 'react-native';

type Appearance = 'light' | 'dark';

const dynamicStyles = (theme: any, appearance: Appearance) => {
  return StyleSheet.create({
    headerButtonContainer: {
      padding: 10,
    },
    Image: {
      width: 25,
      height: 25,
      margin: 6,
    },
    title: {
      color: theme.colors[appearance].primaryText,
      fontSize: 12,
    },
  });
};

export default dynamicStyles;