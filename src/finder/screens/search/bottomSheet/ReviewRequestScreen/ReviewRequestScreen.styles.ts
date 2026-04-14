import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      padding: 16,
      paddingBottom: 40,
    },

    loaderContainer: {
      padding: 32,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
    },

    loaderText: {
      marginTop: 12,
      color: colors.secondaryText,
      fontSize: 16,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 10,
      marginTop: 18,
    },

    sectionBox: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },

    label: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 6,
    },

    offerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 8,
    },

    offerBoxLeft: {
      flex: 1,
      backgroundColor: colors.secondaryBackground,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    offerBoxRight: {
      flex: 1,
      backgroundColor: colors.primaryForeground,
      borderRadius: 14,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    offerNumber: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.primaryText,
    },

    offerPrice: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.buttonText,
      textAlign: 'center',
    },

    offerLabel: {
      fontSize: 12,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 4,
    },

    fuelBox: {
      marginTop: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    fuelText: {
      fontSize: 14,
      color: colors.primaryText,
    },

    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 32,
      gap: 12,
    },

    backButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    backButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },

    sendButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },

    sendButtonText: {
      color: colors.buttonText,
      fontSize: 14,
      fontWeight: '600',
    },
  });
};