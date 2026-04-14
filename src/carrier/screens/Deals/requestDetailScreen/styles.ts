import { StyleSheet, Dimensions } from 'react-native';

const screenHeight = Dimensions.get('window').height;

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      paddingBottom: 120,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
    },
    mapContainer: {
      width: '100%',
      height: screenHeight * 0.3,
    },
    card: {
      margin: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 8,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginTop: 16,
      marginBottom: 10,
    },
    infoText: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 6,
    },
    bottomSpacing: {
      height: 40,
    },
    bottomButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      backgroundColor: colors.primaryBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    acceptButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    acceptButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.buttonText,
    },
    rejectButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rejectButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },
    routeBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeBoxSelected: {
      borderColor: colors.primaryForeground,
      borderWidth: 2,
    },
    routeTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
    },
    routeMeta: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },
    routeOfferBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
   mapFill: {
  flex: 1,
},
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
      marginTop: 10,
    },
    input: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primaryText,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalKeyboardContainer: {
  width: '100%',
  justifyContent: 'flex-end',
},

keyboardDismissButton: {
  alignSelf: 'flex-end',
  marginBottom: 12,
  paddingHorizontal: 12,
  paddingVertical: 8,
  borderRadius: 10,
  backgroundColor: colors.primaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

keyboardDismissButtonText: {
  fontSize: 13,
  fontWeight: '600',
  color: colors.primaryText,
},
routePreparedBox: {
  marginTop: 10,
  padding: 10,
  borderRadius: 10,
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},
routeActionsRow: {
  flexDirection: 'row',
  marginTop: 12,
  gap: 8,
},
routePrimaryButton: {
  flex: 1,
  minHeight: 42,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primaryForeground,
},
routePrimaryButtonText: {
  color: colors.buttonText,
  fontSize: 13,
  fontWeight: '600',
},
routeSecondaryButton: {
  flex: 1,
  minHeight: 42,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},
routeSecondaryButtonText: {
  color: colors.primaryText,
  fontSize: 13,
  fontWeight: '600',
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.35)',
  justifyContent: 'flex-end',
},
modalCard: {
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 16,
  backgroundColor: colors.secondaryBackground,
  borderTopWidth: 1,
  borderColor: colors.border,
},
modalTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 12,
},
modalActionsRow: {
  flexDirection: 'row',
  marginTop: 16,
  gap: 8,
  marginBottom: 8,
},
buttonDisabled: {
  opacity: 0.5,
},
  });
};