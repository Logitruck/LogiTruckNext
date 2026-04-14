import { Platform, StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    compactHeaderArea: {
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: colors.primaryBackground,
    },

    summaryBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 10,
    },

    summaryChip: {
      flex: 1,
      backgroundColor: colors.card || '#F3F4F6',
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
    },

    summaryLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.secondaryText,
      marginBottom: 2,
    },

    summaryValue: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryText,
    },

    odometerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      gap: 10,
    },

    odometerLabel: {
      width: 90,
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryText,
    },

    odometerInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.hairline || '#D1D5DB',
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 10 : 8,
      fontSize: 14,
      color: colors.primaryText,
      backgroundColor: colors.primaryBackground,
    },

    infoContainer: {
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },

    infoRow: {
      marginBottom: 12,
    },

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 4,
    },

    info: {
      fontSize: 14,
      color: colors.secondaryText,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.hairline || '#D1D5DB',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      fontSize: 14,
      color: colors.primaryText,
      backgroundColor: colors.primaryBackground,
    },

    flatListContainer: {
      flex: 1,
      paddingHorizontal: 12,
      paddingTop: 8,
    },

    checklistScrollArea: {
      flex: 1,
      paddingHorizontal: 12,
      paddingBottom: 8,
    },

    checklistListContent: {
      paddingBottom: 16,
    },

    column: {
      justifyContent: 'space-between',
    },

    item: {
      flex: 1,
      marginRight: 10,
      minWidth: 170,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
      backgroundColor: colors.card || colors.primaryBackground,
      padding: 12,
    },

    itemButton: {
      marginRight: 8,
    },

    vehicleInfoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },

    rightContainer: {
      flex: 1,
      marginLeft: 10,
    },

    labelValue: {
      fontSize: 13,
      color: colors.primaryText,
      marginBottom: 2,
    },

    progressBarContainer: {
      width: '100%',
      height: 8,
      backgroundColor: '#E5E7EB',
      borderRadius: 999,
      overflow: 'hidden',
      marginTop: 4,
    },

    progressBar: {
      height: '100%',
      borderRadius: 999,
    },

    footerContainer: {
      marginTop: 12,
      marginBottom: 20,
      flex: 1,
    },

    checklistContainer: {
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
      backgroundColor: colors.card || colors.primaryBackground,
      overflow: 'hidden',
    },

    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline || '#E5E7EB',
      backgroundColor: colors.card || colors.primaryBackground,
    },

    labelTouchable: {
      flex: 1,
      paddingRight: 10,
    },

    controlsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    switchStyle: {
      marginRight: 10,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'center',
      paddingHorizontal: 20,
    },

    modalView: {
      backgroundColor: colors.primaryBackground,
      borderRadius: 16,
      padding: 16,
    },

    textInputContainer: {
      marginTop: 12,
      marginBottom: 16,
    },

    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },

  buttonStyle: {
  flex: 1,
  backgroundColor: colors.primaryForeground,
  minHeight: 56,
  paddingVertical: 14,
  borderRadius: 18,
  alignItems: 'center',
  justifyContent: 'center',
},

    backButton: {
      flex: 1,
      backgroundColor: colors.secondaryBackground || '#9CA3AF',
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    buttonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '700',
  textAlign: 'center',
},

backButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '700',
  textAlign: 'center',
},

reportButtonContainer: {
  paddingHorizontal: 16,
  paddingTop: 8,
  paddingBottom: 34,
  backgroundColor: colors.primaryBackground,
  borderTopWidth: 1,
  borderTopColor: colors.hairline || '#E5E7EB',
},
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: colors.primaryBackground,
    },

    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
      backgroundColor: colors.primaryBackground,
    },

    emptyTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 8,
      textAlign: 'center',
    },

    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 8,
    },

    topTabsContainer: {
      flexDirection: 'row',
      marginTop: 2,
      marginBottom: 12,
      borderRadius: 12,
      backgroundColor: colors.card || '#F3F4F6',
      padding: 4,
    },

    topTabButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 10,
    },

    topTabButtonActive: {
      backgroundColor: colors.primaryForeground,
    },

    topTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.secondaryText,
    },

    topTabTextActive: {
      color: colors.primaryBackground,
      fontWeight: '700',
    },

    vehicleTabsList: {
      paddingBottom: 8,
    },

    vehicleTabCard: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 170,
      marginRight: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
      backgroundColor: colors.card || '#FFFFFF',
    },

    vehicleTabCardActive: {
      backgroundColor: colors.primaryForeground,
      borderColor: colors.primaryForeground,
    },

    vehicleTabInfo: {
      marginLeft: 10,
      flex: 1,
    },

    vehicleTabTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryText,
    },

    vehicleTabTitleActive: {
      color: '#FFFFFF',
    },

    vehicleTabMeta: {
      fontSize: 11,
      color: colors.secondaryText,
      marginTop: 2,
    },

    vehicleTabMetaActive: {
      color: 'rgba(255,255,255,0.9)',
    },
  });
};

export default dynamicStyles;