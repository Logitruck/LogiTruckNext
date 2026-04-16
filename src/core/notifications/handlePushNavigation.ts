import { navigateToGlobalChat } from '../navigation/RootNavigation';

type PushData = Record<string, string>;

export const handlePushNavigation = (type: string, data: PushData) => {
  switch (type) {
    case 'chat':
      if (!data.channelID) {
        console.log('⚠️ Missing channelID in chat push', data);
        return;
      }

      navigateToGlobalChat({
        screen: 'ChatEntryScreen',
        params: {
          channelID: data.channelID,
          title: data.title || '',
          openedFromPushNotification: true,
        },
      });
      break;

    default:
      console.log('ℹ️ Unknown push type:', type, data);
      break;
  }
};