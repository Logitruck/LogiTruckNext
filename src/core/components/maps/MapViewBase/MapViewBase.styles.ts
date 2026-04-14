import { StyleSheet } from 'react-native';

export const dynamicStyles = () => {
  return StyleSheet.create({
    container: {
      flex: 1,
      overflow: 'hidden',
    },
    map: {
      flex: 1,
    },
  });
};