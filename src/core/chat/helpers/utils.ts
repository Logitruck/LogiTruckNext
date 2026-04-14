type LocalizedFn = (key: string) => string;

type MessageLike = {
  content?: string;
  media?: {
    type?: string;
    [key: string]: any;
  };
  [key: string]: any;
} | string | null | undefined;

const formatMessage = (
  message: MessageLike,
  localized: LocalizedFn,
): string => {
  const type =
    typeof message === 'object' && message !== null
      ? message?.media?.type
      : undefined;

  if (type) {
    if (type.includes('video')) {
      return localized('Someone sent a video.');
    } else if (type.includes('audio')) {
      return localized('Someone sent an audio.');
    } else if (type.includes('image')) {
      return localized('Someone sent a photo.');
    } else if (type.includes('file')) {
      return localized('Someone sent a file.');
    }
  }

  if (
    typeof message === 'object' &&
    message !== null &&
    message?.content &&
    message.content.length > 0
  ) {
    return message.content;
  } else if (typeof message === 'string' && message.length > 0) {
    return message;
  } else if (message) {
    return JSON.stringify(message);
  }

  return '';
};

export { formatMessage };