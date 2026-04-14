import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';

type Theme = {
  colors: {
    [key: string]: {
      grey3: string;
      grey9: string;
    };
  };
};

type DynamicStyles = {
  container: ViewStyle;
  searchIcon: ImageStyle;
  searchInput: TextStyle;
  cancelButton: TextStyle;
  searchBoxContainer: ViewStyle;
};

const dynamicStyles = (
  theme: Theme,
  colorScheme: string,
): DynamicStyles => {
  return StyleSheet.create<DynamicStyles>({
    container: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      backgroundColor: theme.colors[colorScheme].grey3,
      margin: 8,
      paddingLeft: 8,
      borderRadius: 12,
      height: 37,
    },
    searchIcon: {
      height: 15,
      width: 15,
      tintColor: theme.colors[colorScheme].grey9,
      marginRight: 1,
    },
    searchInput: {
      padding: 4,
      paddingLeft: 4,
      fontSize: 15,
      width: 250,
      color: theme.colors[colorScheme].grey9,
      backgroundColor: theme.colors[colorScheme].grey3,
    },
    cancelButton: {
      fontSize: 18,
      color: '#0A84FF',
      fontWeight: '500',
      marginRight: 5,
    },
    searchBoxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};

export default dynamicStyles;