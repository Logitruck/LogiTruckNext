import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: string) => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    introCard: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 16,
      padding: 14,
      marginBottom: 12,
    },
    introTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 4,
    },
    introSubtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      lineHeight: 18,
    },
    quickActionsContainer: {
      paddingBottom: 10,
      gap: 8,
    },
    quickActionChip: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: colors.tertiaryBackground,
      marginRight: 8,
    },
    quickActionText: {
      color: colors.primaryText,
      fontSize: 13,
      fontWeight: '600',
    },
    messagesContainer: {
      paddingBottom: 20,
    },
    messageRow: {
      marginBottom: 10,
      flexDirection: 'row',
    },
    messageRowAssistant: {
      justifyContent: 'flex-start',
    },
    messageRowUser: {
      justifyContent: 'flex-end',
    },
    messageBubble: {
      maxWidth: '84%',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
    },
    messageBubbleAssistant: {
      backgroundColor: colors.secondaryBackground,
    },
    messageBubbleUser: {
      backgroundColor: colors.primaryForeground,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 20,
    },
    messageTextAssistant: {
      color: colors.primaryText,
    },
    messageTextUser: {
      color: colors.foregroundContrast,
    },
    loadingText: {
      color: colors.secondaryText,
      fontSize: 13,
      marginTop: 4,
      marginBottom: 12,
    },
    composerContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      backgroundColor: colors.primaryBackground,
      gap: 10,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: 14,
      backgroundColor: colors.inputBackground,
      color: colors.primaryText,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
    },
    sendButton: {
      minHeight: 44,
      paddingHorizontal: 16,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    sendButtonDisabled: {
      opacity: 0.6,
    },
    sendButtonText: {
      color: colors.foregroundContrast,
      fontSize: 14,
      fontWeight: '700',
    },
  });
};

export default dynamicStyles;