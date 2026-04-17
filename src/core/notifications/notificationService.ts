export type PushData = Record<string, string>;

export type InAppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: PushData;
};

type NotificationHandler = (notification: InAppNotification) => void;

let showNotificationHandler: NotificationHandler | null = null;

export const registerInAppNotificationHandler = (
  handler: NotificationHandler,
) => {
  showNotificationHandler = handler;
};

export const unregisterInAppNotificationHandler = () => {
  showNotificationHandler = null;
};

export const showInAppNotification = (notification: InAppNotification) => {
  showNotificationHandler?.(notification);
};