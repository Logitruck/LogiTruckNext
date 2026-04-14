import { StyleSheet, ViewStyle, TextStyle } from 'react-native';

type Theme = {
  colors: {
    [key: string]: {
      primaryText: string;
    };
  };
};

type Styles = {
  imageContainer: ViewStyle;
  title: TextStyle;
  description: TextStyle;
  buttonOuterContainer: ViewStyle;
  buttonContainer: ViewStyle;
  buttonName: TextStyle;
};

const dynamicStyles = (
  theme: Theme,
  appearance: string,
): Styles => {
  return StyleSheet.create<Styles>({
    imageContainer: {
      alignSelf: 'center',
    },

    title: {
      fontSize: 30,
      fontWeight: 'bold',
      alignSelf: 'center',
      color: theme.colors[appearance].primaryText,
      marginBottom: 15,
    },

    description: {
      alignSelf: 'center',
      color: theme.colors[appearance].primaryText,
      textAlign: 'center',
      width: '90%',
      lineHeight: 20,
    },

    buttonOuterContainer: {
      flexDirection: 'row',
    },

    buttonContainer: {
      alignSelf: 'center',
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,
    },

    buttonName: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
};

export default dynamicStyles;