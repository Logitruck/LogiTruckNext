import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    header: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 16,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      marginBottom: 16,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.buttonText,
    },
    defaultStatus: {
      backgroundColor: colors.secondaryText,
    },
    setup: {
      backgroundColor: '#f39c12',
    },
    execution: {
      backgroundColor: '#2980b9',
    },
    completed: {
      backgroundColor: '#27ae60',
    },
    cancelled: {
      backgroundColor: '#c0392b',
    },
    section: {
      marginBottom: 20,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },
    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.secondaryText,
      marginTop: 8,
      marginBottom: 4,
    },
    value: {
      fontSize: 15,
      color: colors.primaryText,
    },
    actionsContainer: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 48,
      paddingHorizontal: 14,
      marginBottom: 10,
      borderRadius: 12,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryText,
    },
    routeCard: {
  marginTop: 10,
  padding: 12,
  borderRadius: 12,
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

routeTitle: {
  fontSize: 14,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 6,
},

routeMeta: {
  fontSize: 12,
  color: colors.secondaryText,
  marginTop: 4,
},
tabHeaderRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 12,
},

inlineActionButton: {
  minHeight: 34,
  paddingHorizontal: 12,
  borderRadius: 10,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.primaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

inlineActionText: {
  fontSize: 13,
  fontWeight: '700',
  color: colors.primaryText,
},

tabsSection: {
  marginBottom: 20,
},
projectHeaderBlock: {
  marginBottom: 20,
},

projectHeaderLabel: {
  fontSize: 14,
  fontWeight: '600',
  color: colors.secondaryText,
  marginBottom: 6,
},

projectHeaderTitle: {
  fontSize: 28,
  fontWeight: '800',
  color: colors.primaryText,
  marginBottom: 14,
},

projectMetaRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 12,
},

startDateInline: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
},

startDateInlineLabel: {
  fontSize: 14,
  fontWeight: '700',
  color: colors.secondaryText,
  marginRight: 6,
},

startDateInlineValue: {
  fontSize: 14,
  color: colors.primaryText,
  fontWeight: '600',
},
summaryRow: {
  flexDirection: 'row',
  gap: 10,
  marginBottom: 16,
  flexWrap: 'wrap',
},


summaryPill: {
  minWidth: 100,
  paddingHorizontal: 12,
  paddingVertical: 10,
  borderRadius: 12,
  backgroundColor: colors.primaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

summaryPillLabel: {
  fontSize: 12,
  fontWeight: '700',
  color: colors.secondaryText,
  marginBottom: 4,
},

summaryPillValue: {
  fontSize: 18,
  fontWeight: '800',
  color: colors.primaryText,
},

moreText: {
  fontSize: 13,
  fontWeight: '700',
  color: colors.secondaryText,
  marginTop: 4,
},
   loaderContainer: {
      minHeight: 320,
      justifyContent: 'center',
      alignItems: 'center',
    },

  });
};