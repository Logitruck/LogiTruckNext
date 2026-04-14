import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: colors.primaryBackground,
      minHeight: '100%',
    },
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },
    cancelButton: {
      marginTop: 20,
      paddingVertical: 12,
      paddingHorizontal: 20,
      backgroundColor: '#fee2e2',
      borderRadius: 10,
      alignItems: 'center',
      borderColor: '#ef4444',
      borderWidth: 1,
    },
    cancelButtonText: {
      color: '#b91c1c',
      fontWeight: 'bold',
      fontSize: 16,
    },
    executionNotice: {
      marginTop: 20,
      fontSize: 16,
      fontStyle: 'italic',
      color: colors.primaryText,
      textAlign: 'center',
    },
    summaryCard: {
  padding: 16,
  borderRadius: 16,
  marginBottom: 16,
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

summaryTitle: {
  fontSize: 17,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 8,
},

summaryText: {
  fontSize: 14,
  color: colors.primaryText,
  marginBottom: 4,
},
routesSection: {
  marginHorizontal: 16,
  marginBottom: 16,
},

sectionTitle: {
  fontSize: 18,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 12,
},

routeCard: {
  marginBottom: 12,
  padding: 14,
  borderRadius: 14,
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

routeCardTitle: {
  fontSize: 15,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 8,
},

routeCardText: {
  fontSize: 13,
  color: colors.secondaryText,
  marginBottom: 4,
},
routesHeaderRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},

routesToggleText: {
  fontSize: 13,
  fontWeight: '600',
  color: colors.primaryForeground,
},
  });
};