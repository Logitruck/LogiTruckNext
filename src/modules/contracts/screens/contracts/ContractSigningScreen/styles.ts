import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    loaderContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
    },
    infoText: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 12,
      textAlign: 'center',
    },
    pdf: {
      width: '100%',
      height: 500,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colors.secondaryBackground,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    button: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.buttonText,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      padding: 16,
    },
    signatureModal: {
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    closeButton: {
      alignSelf: 'flex-end',
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    closeButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },
    signatureContainer: {
      height: 280,
      overflow: 'hidden',
      borderRadius: 12,
      backgroundColor: colors.secondaryBackground,
    },
    cancelActionButton: {
      marginTop: 12,
    },
  });
};