import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    map: {
      flex: 1,
    },

    topOverlay: {
      position: 'absolute',
      top: 56,
      left: 12,
      right: 12,
      zIndex: 20,
    },

    topSummary: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },

    summaryPill: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 8,
      marginHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,

      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },

    summaryLabel: {
      fontSize: 11,
      color: colors.secondaryText,
      marginBottom: 3,
      fontWeight: '600',
    },

    summaryValue: {
      fontSize: 22,
      color: colors.primaryText,
      fontWeight: '800',
    },

    filterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    filterChip: {
      flex: 1,
      marginHorizontal: 4,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 22,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',

      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 3,
      shadowOffset: { width: 0, height: 1 },
      elevation: 2,
    },

    filterChipActive: {
      backgroundColor: colors.primaryForeground,
      borderColor: colors.primaryForeground,
    },

    filterChipText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryText,
      textAlign: 'center',
    },

    filterChipTextActive: {
      color: colors.buttonText,
    },

    markerBadge: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
    },

    markerShadow: {
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },

    calloutContainer: {
      minWidth: 180,
      maxWidth: 220,
      backgroundColor: colors.primaryBackground,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.hairline,

      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },

    calloutTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.primaryText,
      marginBottom: 4,
    },

    calloutSubtitle: {
      fontSize: 12,
      color: colors.secondaryText,
      marginBottom: 4,
      lineHeight: 16,
    },

    calloutStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },

    calloutStatusText: {
      marginLeft: 6,
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryText,
    },

    calloutActionButton: {
      marginTop: 8,
      backgroundColor: colors.primaryForeground,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    calloutActionText: {
      color: colors.buttonText,
      fontSize: 12,
      fontWeight: '700',
    },

    recenterButton: {
      position: 'absolute',
      right: 16,
      bottom: 290,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,

      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },

    overlayCenter: {
      position: 'absolute',
      top: 180,
      left: 24,
      right: 24,
      backgroundColor: colors.primaryBackground,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
      zIndex: 20,
    },

    overlayText: {
      marginTop: 10,
      fontSize: 14,
      color: colors.primaryText,
      fontWeight: '600',
    },

    emptyView: {
      position: 'absolute',
      bottom: 120,
      left: 24,
      right: 24,
      backgroundColor: colors.primaryBackground,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.hairline,
      zIndex: 20,
    },

    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      fontWeight: '600',
    },

    bottomCard: {
      position: 'absolute',
      left: 12,
      right: 12,
      bottom: 16,
      backgroundColor: colors.primaryBackground,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.hairline,
      zIndex: 20,

      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },

    bottomCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },

    bottomCardHeaderLeft: {
      flex: 1,
      paddingRight: 12,
    },

    bottomCardTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
    },

    bottomCardSubtitle: {
      marginTop: 4,
      fontSize: 13,
      color: colors.secondaryText,
    },

    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },

    statusText: {
      marginLeft: 6,
      fontSize: 13,
      color: colors.primaryText,
      fontWeight: '600',
    },

    bottomCardInfo: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 6,
      lineHeight: 18,
    },

    bottomCardActions: {
      marginTop: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    primaryButton: {
      flex: 1,
      backgroundColor: colors.primaryForeground,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
    },

    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 14,
      fontWeight: '700',
    },

    secondaryButton: {
      flex: 1,
      backgroundColor: colors.secondaryBackground,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },

    secondaryButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '700',
    },

    noJobBadge: {
      flex: 1,
      backgroundColor: colors.secondaryBackground,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    noJobBadgeText: {
      fontSize: 13,
      color: colors.secondaryText,
      fontWeight: '600',
    },
  });
};

export default dynamicStyles;