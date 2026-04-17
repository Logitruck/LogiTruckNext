import { navigateToGlobalChat } from '../navigation/RootNavigation';

type PushData = Record<string, string>;

export const handlePushNavigation = (type: string, data: PushData) => {
  switch (type) {
    case 'chat': {
      const channelID = data.channelID;

      if (!channelID) {
        console.log('⚠️ Missing channelID in chat push', data);
        return;
      }

      navigateToGlobalChat({
        screen: 'ChatEntryScreen',
        params: {
          channelID,
          title: data.title || '',
          openedFromPushNotification: true,
        },
      });
      return;
    }

    default:
      console.log('ℹ️ Unknown push type:', type, data);
      return;
  }
};