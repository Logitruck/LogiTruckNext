import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: string) => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primaryText,
    },
  });
};