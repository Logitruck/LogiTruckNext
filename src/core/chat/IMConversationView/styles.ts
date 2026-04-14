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
      padding: 10,
    },
    chatItemContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    chatItemContent: {
      flex: 1,
      alignSelf: 'center',
      marginLeft: 10,
    },
    chatFriendName: {
      color: colorSet.primaryText,
      fontSize: 17,
      fontWeight: '500',
    },
    content: {
      flexDirection: 'row',
      marginTop: 5,
    },
    message: {
      flex: 2,
      color: colorSet.secondaryText,
      fontWeight: '500',
    },
    unReadmessage: {
      fontWeight: 'bold',
      color: colorSet.primaryText,
    },
  });
};

export default dynamicStyles;