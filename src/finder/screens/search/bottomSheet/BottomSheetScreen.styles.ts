import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    sheet: {
      flex: 1,
    },
    background: {
      backgroundColor: colors.white || colors.primaryBackground,
    },
    content: {
      flex: 1,
      height: '100%',
      width: '100%',
    },
    handle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: colors.grey6 || colors.border,
      alignSelf: 'center',
      marginVertical: 8,
    },
  });
};
export default dynamicStyles;