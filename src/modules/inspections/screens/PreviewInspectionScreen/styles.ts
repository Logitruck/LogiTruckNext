import { Platform, StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    loaderContainer: {
      minHeight: 300,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoText: {
      marginTop: 12,
      fontSize: 15,
      color: colors.primaryText,
      textAlign: 'center',
    },
    pdf: {
      width: '100%',
      height: 640,
      backgroundColor: colors.primaryBackground,
      borderRadius: 12,
      overflow: 'hidden',
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      flex: 1,
      backgroundColor: colors.primaryForeground,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    cancelActionButton: {
      marginTop: 12,
    },
    buttonText: {
      color: colors.primaryBackground,
      fontWeight: '700',
      fontSize: 15,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    signatureModal: {
      backgroundColor: colors.primaryBackground,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: 16,
      minHeight: 420,
    },
    closeButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 8,
      paddingVertical: 6,
    },
    closeButtonText: {
      fontSize: 22,
      color: colors.primaryText,
      fontWeight: '700',
    },
    signatureContainer: {
      height: 300,
      marginTop: 8,
      overflow: 'hidden',
      borderRadius: 12,
      backgroundColor: colors.primaryBackground,
    },
    reportsSummaryBox: {
  marginHorizontal: 16,
  marginTop: 8,
  marginBottom: 12,
  padding: 14,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.hairline || '#E5E7EB',
  backgroundColor: colors.card || colors.primaryBackground,
},

reportsSummaryTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 10,
},

reportSummaryRow: {
  marginBottom: 8,
},

reportSummaryVehicle: {
  fontSize: 14,
  fontWeight: '700',
  color: colors.primaryText,
},

reportSummaryMeta: {
  fontSize: 12,
  color: colors.secondaryText,
  marginTop: 2,
},
  });
};

export default dynamicStyles;