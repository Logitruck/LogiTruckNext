import { StyleSheet, ViewStyle } from 'react-native';

type Styles = {
  storiesContainer: ViewStyle;
  seenStyle: ViewStyle;
};

const dynamicStyles = (theme: any, appearance: string): Styles => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create<Styles>({
    storiesContainer: {
      backgroundColor: colorSet.primaryBackground,
      marginBottom: 5,
      flexDirection: 'row',
    },
    seenStyle: {
      borderColor: colorSet.grey6,
      borderWidth: 1,
    },
  });
};

export default dynamicStyles;