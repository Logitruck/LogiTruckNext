import { StyleSheet, TextStyle } from 'react-native';

type Styles = {
  tnPrimaryText: TextStyle;
  tnSecondaryText: TextStyle;
};

const dynamicStyles = (theme: any, appearance: string): Styles => {
  return StyleSheet.create<Styles>({
    tnPrimaryText: {
      color: theme.colors[appearance].primaryText,
    },
    tnSecondaryText: {
      color: theme.colors[appearance].secondaryText,
    },
  });
};

export default dynamicStyles;