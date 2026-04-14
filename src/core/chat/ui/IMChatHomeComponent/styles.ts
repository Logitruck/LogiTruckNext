import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: string) => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorSet.primaryBackground,
    },
    userImageContainer: {
      borderWidth: 0,
    },
    chatsChannelContainer: {
      flex: 1,
      padding: 10,
      backgroundColor: colorSet.primaryBackground,
    },
    searchBarContainer: {
      marginBottom: 8,
    },
    content: {
      flexDirection: 'row',
    },
    message: {
      flex: 2,
      color: colorSet.secondaryText,
    },
  });
};

export default dynamicStyles;