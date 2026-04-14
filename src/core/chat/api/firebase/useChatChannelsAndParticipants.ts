import { useMemo } from 'react';
import { useChatChannels } from './useChatChannels';
import { useCurrentUser } from '../../../onboarding/hooks/useAuth';
import type {
  ChatChannel,
  ChatParticipant,
} from './firebaseChatClient';

export type AvailableChatParticipant = ChatParticipant & {
  id: string;
};

export type HydratedChatListItem = ChatChannel & {
  participants: ChatParticipant[];
};

type UseChatChannelsAndParticipantsParams = {
  availableParticipants?: AvailableChatParticipant[];
};

type UseChatChannelsAndParticipantsReturn = {
  hydratedListWithChannelsAndParticipants: HydratedChatListItem[];
  channels: ChatChannel[] | null;
};

export const useChatChannelsAndParticipants = ({
  availableParticipants = [],
}: UseChatChannelsAndParticipantsParams): UseChatChannelsAndParticipantsReturn => {
  const currentUser = useCurrentUser();
  const { channels } = useChatChannels();

  const hydratedListWithChannelsAndParticipants = useMemo(() => {
    const currentUserID = currentUser?.id || currentUser?.userID;

    if (!currentUserID) {
      return (channels || []) as HydratedChatListItem[];
    }

    const all: HydratedChatListItem[] = channels
      ? [...(channels as HydratedChatListItem[])]
      : [];

    availableParticipants.forEach(participant => {
      const participantID = participant?.id || participant?.userID;

      if (!participantID || participantID === currentUserID) {
        return;
      }

      all.push({
        id:
          currentUserID < participantID
            ? `${currentUserID}${participantID}`
            : `${participantID}${currentUserID}`,
        channelID:
          currentUserID < participantID
            ? `${currentUserID}${participantID}`
            : `${participantID}${currentUserID}`,
        participants: [participant],
        type: 'direct',
        status: 'active',
      });
    });

    return all.reduce<HydratedChatListItem[]>((acc, curr) => {
      if (!acc.some(item => item.id === curr.id)) {
        acc.push(curr);
      }
      return acc;
    }, []);
  }, [availableParticipants, channels, currentUser?.id, currentUser?.userID]);

  return {
    hydratedListWithChannelsAndParticipants,
    channels,
  };
};

export default useChatChannelsAndParticipants;