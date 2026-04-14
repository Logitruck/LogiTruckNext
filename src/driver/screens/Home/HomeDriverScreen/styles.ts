import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 12,
    },

    headerIconButton: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    menuButton: {
      marginLeft: 16,
    },

    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },

    emptyText: {
      marginTop: 10,
      color: colors.secondaryText,
      fontSize: 14,
    },

    titleHeader: {
      fontSize: 18,
      fontWeight: '700',
      paddingHorizontal: 14,
      paddingTop: 16,
      paddingBottom: 10,
      color: colors.primaryText,
      backgroundColor: colors.primaryBackground,
    },

    activeTripBanner: {
      marginHorizontal: 14,
      marginTop: 14,
      marginBottom: 6,
      padding: 14,
      borderRadius: 12,
      backgroundColor: '#E8F1FF',
      borderWidth: 1,
      borderColor: '#B9D3FF',
    },

    activeTripHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },

    activeTripInfo: {
      flex: 1,
    },

    activeTripTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#0B57D0',
      marginBottom: 4,
    },

    activeTripText: {
      fontSize: 14,
      color: '#0B57D0',
    },

    returnButton: {
      backgroundColor: '#0B57D0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
    },

    returnButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },

    card: {
      marginHorizontal: 14,
      marginBottom: 10,
      borderRadius: 14,
      backgroundColor: colors.card,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
    },

    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
    },

    itemIcon: {
      marginRight: 12,
    },

    itemDetails: {
      flex: 1,
    },

    titleText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 4,
    },

    subtitleText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 2,
    },

    statusText: {
      fontSize: 13,
      fontWeight: '600',
      marginTop: 4,
    },

 actionColumn: {
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 12,
},

actionButton: {
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 10,
},

    actionLabel: {
      marginTop: 4,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.primaryText,
    },

    pendingSection: {
      marginHorizontal: 14,
      marginTop: 4,
      marginBottom: 8,
      paddingBottom: 8,
      borderRadius: 14,
      backgroundColor: '#FFF7E8',
      borderWidth: 1,
      borderColor: '#F3D08A',
      overflow: 'hidden',
    },

    pendingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: '#F3D08A',
    },

    pendingItemDetails: {
      flex: 1,
      marginRight: 12,
    },

    pendingItemTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#8A5A00',
      marginBottom: 2,
    },

    pendingItemSubtitle: {
      fontSize: 12,
      color: '#8A5A00',
      marginBottom: 1,
    },

    jobCard: {
      marginHorizontal: 14,
      marginBottom: 10,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    jobCardWarning: {
      backgroundColor: '#FFF6F6',
      borderColor: '#F2CACA',
    },

    jobInfo: {
      flex: 1,
      paddingRight: 12,
    },

    jobRoute: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 4,
    },

    jobMeta: {
      fontSize: 13,
      color: colors.primaryText,
      marginBottom: 2,
    },

    jobMetaMuted: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },

    jobActions: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    jobActionButton: {
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    inspectLabel: {
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
      color: colors.primaryText,
      marginTop: 4,
    },

  });
};

export default dynamicStyles;