import { navigate } from '../navigation/RootNavigation';

type PushData = Record<string, string>;

export const handlePushNavigation = (type: string, data: PushData) => {
  switch (type) {
    case 'chat':
      navigate('PersonalChat', {
        channel: {
          id: data.channelID,
          channelID: data.channelID,
          name: data.title || '',
        },
        isChatUserItemPress: false,
      });
      break;

    case 'job_assigned':
    case 'job':
      navigate('JobDetails', {
        jobID: data.jobID,
        channelID: data.channelID,
        projectID: data.projectID,
      });
      break;

    case 'tracking':
      navigate('HomeTrackingScreen', {
        jobID: data.jobID,
        channelID: data.channelID,
        projectID: data.projectID,
      });
      break;

    default:
      console.log('Unknown push type:', type, data);
      break;
  }
};