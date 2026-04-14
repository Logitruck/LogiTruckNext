import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    contentContainer: {
      padding: 16,
      paddingBottom: 120,
    },

    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
      textAlign: 'center',
    },

    card: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    

    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
    },

    itemText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 4,
    },

    faultList: {
      marginTop: 10,
    },

    faultListTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 4,
    },

    faultItem: {
      fontSize: 12,
      color: '#e53935',
      marginBottom: 2,
    },

    signatureContainer: {
      alignItems: 'center',
      marginTop: 12,
    },

    signatureImage: {
      width: 220,
      height: 140,
      borderRadius: 12,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    signatureLine: {
      height: 1,
      width: '80%',
      backgroundColor: colors.border,
      marginTop: 8,
    },

    signatureText: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 6,
    },

    bottomButtonsContainer: {
      marginTop: 16,
      gap: 12,
    },

    primaryButton: {
      minHeight: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },

    primaryButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.white || '#FFFFFF',
    },

    secondaryButton: {
      minHeight: 48,
      borderRadius: 14,
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

    helperText: {
      fontSize: 12,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 6,
    },

    

    

    signatureModal: {
  width: '92%',
  backgroundColor: colors.primaryBackground,
  borderRadius: 20,
  padding: 16,
},

signaturePadContainer: {
  width: '100%',
  height: 320,
  overflow: 'hidden',
  borderRadius: 12,
  backgroundColor: '#FFFFFF',
  marginBottom: 16,
},

modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 16,
},
  });
};

export default dynamicStyles;