import { StyleSheet } from 'react-native';

export const dynamicStyles = (
  colors: any,
  spaces: any,
  fontSizes: any,
  fontWeights: any,
  theme: any
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spaces.horizontal.l,
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
    },
    title: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.l,
      marginBottom: spaces.vertical.l,
      textAlign: 'center',
      color: colors.primaryText,
    },
    input: {
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: theme.button.borderRadius * 1.5,
      paddingHorizontal: spaces.horizontal.m,
      marginBottom: spaces.vertical.m,
      backgroundColor: colors.inputBackground,
      color: colors.primaryText,
      fontSize: fontSizes.m,
    },
    button: {
      height: 52,
      borderRadius: theme.button.borderRadius * 1.5,
      backgroundColor: colors.primaryForeground,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spaces.vertical.s,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: fontSizes.m,
      fontWeight: fontWeights.m,
    },
    loader: {
      marginTop: spaces.vertical.m,
    },
  });