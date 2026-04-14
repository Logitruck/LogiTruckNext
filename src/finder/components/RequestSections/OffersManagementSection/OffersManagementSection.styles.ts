import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    header: {
      fontSize: 16,
      fontWeight: 'bold',
      marginVertical: 8,
      color: colors.primaryText,
    },
    card: {
      padding: 12,
      backgroundColor: colors.primaryBackground,
      borderRadius: 8,
      marginVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendor: {
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },
    text: {
      color: colors.primaryText,
      marginTop: 2,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      gap: 10,
    },
    accept: {
      flex: 1,
      backgroundColor: colors.green,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    reject: {
      flex: 1,
      backgroundColor: colors.red,
      paddingVertical: 10,
      borderRadius: 6,
      alignItems: 'center',
    },
    acceptText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    rejectText: {
      color: '#ffffff',
      fontWeight: '600',
    },
    empty: {
      marginTop: 10,
      fontStyle: 'italic',
      color: colors.secondaryText,
    },
    routesBox: {
  marginTop: 10,
  padding: 10,
  borderRadius: 12,
  backgroundColor: colors.secondaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},

routesHeader: {
  fontSize: 13,
  fontWeight: '700',
  color: colors.primaryText,
  marginBottom: 8,
},

routeItem: {
  marginBottom: 8,
},

routeText: {
  fontSize: 13,
  color: colors.primaryText,
},

routeMeta: {
  fontSize: 12,
  color: colors.secondaryText,
  marginTop: 2,
},
summaryHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},

summaryLeft: {
  flex: 1,
  paddingRight: 12,
},

summaryRight: {
  alignItems: 'flex-end',
},

summaryMainValue: {
  fontSize: 22,
  fontWeight: '700',
  marginTop: 6,
  color: colors.primaryText,
},

summaryMeta: {
  fontSize: 12,
  color: colors.secondaryText,
  marginBottom: 4,
},

expandText: {
  fontSize: 12,
  fontWeight: '600',
  color: colors.primaryForeground,
  marginTop: 4,
},

expandedContent: {
  marginTop: 14,
},

commentBox: {
  marginBottom: 12,
  padding: 12,
  borderRadius: 12,
  backgroundColor: colors.primaryBackground,
  borderWidth: 1,
  borderColor: colors.border,
},
  });
};