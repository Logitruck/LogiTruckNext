// src/navigation/types.ts

export type RootStackParamList = {
  PersonalChat: {
    channel: any;
    isChatUserItemPress?: boolean;
  };

  JobDetails: {
    jobID: string;
    channelID: string;
    projectID: string;
  };

  HomeTrackingScreen: {
    jobID: string;
    channelID: string;
    projectID: string;
  };

  // agrega aquí las demás pantallas
};