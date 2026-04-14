import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

type Styles = {
  DNButtonContainer: ViewStyle;
  DNButtonText: TextStyle;
  DNButtonShadow: ViewStyle;
};

const dynamicStyles = (theme: any, appearance: string): Styles => {
  return StyleSheet.create<Styles>({
    DNButtonContainer: {
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors[appearance].primaryForeground,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 16,
      paddingBottom: 16,
    },
    DNButtonText: {
      color: theme.colors[appearance].foregroundContrast,
      fontSize: theme.fontSizes.m,
      fontWeight: theme.fontWeights.m,
    },
    DNButtonShadow: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
  });
};

export default dynamicStyles;