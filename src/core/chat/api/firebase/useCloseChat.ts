// src/core/chat/api/firebase/useCloseChat.ts

import { useChatChannels } from './useChatChannels';
import { useCurrentUser } from '../../../onboarding/hooks/useAuth';

type CloseChatResult = {
  success: boolean;
  error?: any;
};

export const useCloseChat = () => {
  const { updateGroup } = useChatChannels();
  const currentUser = useCurrentUser();

  const closeChat = async (
    channelID: string,
    reason: string = 'completed',
  ): Promise<CloseChatResult> => {
    try {
      if (!channelID || !currentUser?.id) {
        throw new Error('Missing channelID or user');
      }

      await updateGroup(channelID, currentUser.id, {
        status: 'closed', // 🔥 mejor que 'inactive'
        closingReason: reason,
        closedAt: Math.floor(Date.now() / 1000),
        closedBy: currentUser.id,
      });

      return { success: true };
    } catch (error) {
      console.log('Error closing chat:', error);
      return { success: false, error };
    }
  };

  return { closeChat };
};