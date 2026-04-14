import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    containerSummary: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },

    loaderContainer: {
      minHeight: 320,
      justifyContent: 'center',
      alignItems: 'center',
    },

    statusText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
    },

    pdf: {
      width: '100%',
      height: 520,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    actionsContainer: {
      marginTop: 20,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
      alignItems: 'center',
      gap: 12,
    },

    backButton: {
      flex: 1,
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    sendButton: {
      flex: 1,
      minHeight: 48,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },

    backButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
    },

    sendButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.buttonText,
      textAlign: 'center',
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'center',
      padding: 16,
    },

    signatureModal: {
      backgroundColor: colors.primaryBackground,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },

    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
      textAlign: 'center',
    },

    signatureActions: {
      marginTop: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 46,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },

    primaryButton: {
      flex: 1,
      minHeight: 46,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },

    primaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.buttonText,
    },
  });
};

export default dynamicStyles;