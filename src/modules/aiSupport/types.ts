export type SupportRole = 'carrier' | 'finder' | 'driver';

export type SupportContext = {
  role: SupportRole;
  module?: string;
  screen?: string;
  requestID?: string;
  projectID?: string;
  jobID?: string;
  channelID?: string;
  vehicleID?: string;
  extra?: Record<string, any>;
};

export type SupportMessageSender = 'assistant' | 'user';

export type SupportMessage = {
  id: string;
  sender: SupportMessageSender;
  text: string;
  createdAt: number;
};

export type SupportQuickAction = {
  id: string;
  label: string;
  prompt: string;
};