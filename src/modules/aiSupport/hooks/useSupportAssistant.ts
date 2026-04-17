import { useCallback, useMemo, useState } from 'react';
import { SupportContext, SupportMessage } from '../types';
import {
  buildSupportQuickActions,
  buildSupportWelcomeMessage,
} from '../utils/buildSupportContext';

const createMessage = (
  sender: 'assistant' | 'user',
  text: string,
): SupportMessage => ({
  id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  sender,
  text,
  createdAt: Date.now(),
});

const buildFallbackResponse = (
  input: string,
  context: SupportContext,
) => {
  const moduleLabel = context.module || 'this section';

  return `I can help with ${moduleLabel}. You asked: "${input}". Backend AI support is not connected yet, but the support screen is ready to send contextual requests.`;
};

export const useSupportAssistant = (context: SupportContext) => {
  const [messages, setMessages] = useState<SupportMessage[]>([
    createMessage('assistant', buildSupportWelcomeMessage(context)),
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const quickActions = useMemo(
    () => buildSupportQuickActions(context),
    [context],
  );

  const sendMessage = useCallback(
    async (text?: string) => {
      const raw = (text ?? input).trim();
      if (!raw || loading) {
        return;
      }

      const userMessage = createMessage('user', raw);
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setLoading(true);

      try {
        await new Promise(resolve => setTimeout(resolve, 500));

        const assistantReply = createMessage(
          'assistant',
          buildFallbackResponse(raw, context),
        );

        setMessages(prev => [...prev, assistantReply]);
      } finally {
        setLoading(false);
      }
    },
    [context, input, loading],
  );

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    quickActions,
  };
};