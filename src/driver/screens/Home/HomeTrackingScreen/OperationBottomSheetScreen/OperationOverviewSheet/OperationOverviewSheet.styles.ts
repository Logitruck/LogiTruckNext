import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.white || '#FFFFFF',
    },

    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },

    sheetTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    statusPill: {
      backgroundColor: '#F3F4F6',
      color: '#111827',
      fontSize: 12,
      fontWeight: '700',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      overflow: 'hidden',
    },

    etaMini: {
      fontSize: 13,
      fontWeight: '700',
      color: '#111827',
    },

   

    metricPillLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 4,
      fontWeight: '600',
    },

    

    routeCard: {
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E7EB',
      padding: 16,
      marginBottom: 14,
    },

    routeRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },

    dotGreen: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#22C55E',
      marginTop: 3,
      marginRight: 12,
    },

    dotRed: {
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#EF4444',
      marginTop: 3,
      marginRight: 12,
    },

    routeTextWrapper: {
      flex: 1,
    },

    routeLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: '#6B7280',
      marginBottom: 4,
      textTransform: 'uppercase',
    },

    routeValue: {
      fontSize: 15,
      fontWeight: '700',
      color: '#111827',
      lineHeight: 20,
    },

    routeAddress: {
      fontSize: 13,
      color: '#6B7280',
      marginTop: 2,
      lineHeight: 18,
    },

    routeDivider: {
      width: 2,
      height: 20,
      backgroundColor: '#D1D5DB',
      marginLeft: 6,
      marginVertical: 6,
    },


    contactCard: {
  borderRadius: 16,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  padding: 14,
  marginBottom: 10,
},

instructionsCard: {
  borderRadius: 16,
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  padding: 14,
  marginBottom: 10,
},

    sectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: '#6B7280',
      marginBottom: 8,
      textTransform: 'uppercase',
    },

    contactName: {
      fontSize: 16,
      fontWeight: '800',
      color: '#111827',
      marginBottom: 4,
    },

    contactPhone: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 12,
    },

    callButton: {
      backgroundColor: '#111827',
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    callButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '800',
    },

    

    instructionsText: {
      fontSize: 14,
      lineHeight: 20,
      color: '#111827',
    },

    bottomActionBar: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 16,
      backgroundColor: colors.white || '#FFFFFF',
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    },
nextActionButton: {
  flex: 1,
  backgroundColor: '#111827',
  paddingVertical: 12,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
},
nextActionButtonFull: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
nextActionButtonText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '800',
},


    arrivalButton: {
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },

    arrivalButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '800',
    },

    disabledButton: {
      backgroundColor: '#C7C7C7',
    },
    topActionsRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 14,
},

navigateButton: {
  flex: 1,
  backgroundColor: '#111827',
  paddingVertical: 12,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
},

navigateButtonText: {
  color: '#FFFFFF',
  fontSize: 14,
  fontWeight: '800',
},

nextActionButtonDisabled: {
  flex: 1,
  backgroundColor: '#E5E7EB',
  paddingVertical: 12,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
},

nextActionButtonDisabledText: {
  color: '#9CA3AF',
  fontSize: 14,
  fontWeight: '800',
},

mainDestinationTitle: {
  fontSize: 18,
  fontWeight: '800',
  color: '#111827',
  marginBottom: 2,
},

mainDestinationSubtitle: {
  fontSize: 13,
  color: '#6B7280',
  marginBottom: 10,
},

metricsRow: {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 10,
},

metricPill: {
  flex: 1,
  backgroundColor: '#F9FAFB',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 14,
  paddingVertical: 10,
  paddingHorizontal: 12,
  alignItems: 'center',
  justifyContent: 'center',
},

metricPillValue: {
  fontSize: 16,
  fontWeight: '800',
  color: '#111827',
},


  });
};

export default dynamicStyles;