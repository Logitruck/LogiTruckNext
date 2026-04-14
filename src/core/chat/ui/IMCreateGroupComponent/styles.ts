import { Dimensions, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

const { height } = Dimensions.get('window');

type Styles = {
  container: ViewStyle;
  listContainer: ViewStyle;
  itemContainer: ViewStyle;
  chatIconContainer: ViewStyle;
  addFlexContainer: ViewStyle;
  divider: ViewStyle;
  photo: ImageStyle;
  name: TextStyle;
  chatItemIcon: ImageStyle;
  checkContainer: ViewStyle;
  checked: ImageStyle;
  emptyViewContainer: ViewStyle;
};

const dynamicStyles = (theme: any, appearance: string): Styles => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create<Styles>({
    container: {
      flex: 1,
      backgroundColor: colorSet.primaryBackground,
    },
    listContainer: {
      flex: 1,
    },
    itemContainer: {
      padding: 10,
      alignItems: 'center',
      flexDirection: 'row',
      width: '100%',
    },
    chatIconContainer: {
      flex: 6,
      flexDirection: 'row',
      alignItems: 'center',
    },
    addFlexContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    divider: {
      bottom: 0,
      left: 70,
      right: 0,
      position: 'absolute',
      height: 0.5,
      backgroundColor: colorSet.hairline,
    },
    photo: {
      height: 48,
      borderRadius: 24,
      width: 48,
    },
    name: {
      marginLeft: 20,
      alignSelf: 'center',
      flex: 1,
      color: colorSet.primaryText,
      fontSize: 16,
      fontWeight: '500',
    },
    chatItemIcon: {
      height: 70,
      width: 70,
    },
    checkContainer: {},
    checked: {
      width: 18,
      height: 18,
    },
    emptyViewContainer: {
      marginTop: height / 6,
    },
  });
};

export default dynamicStyles;