import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      marginBottom: 4,
    },

    summaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 12,
    },

    summaryChip: {
      minWidth: 76,
      borderRadius: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },

    summaryChipLabel: {
      fontSize: 11,
      color: colors.secondaryText,
      marginBottom: 2,
    },

    summaryChipValue: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primaryText,
    },

    summaryLinkChip: {
      borderRadius: 14,
      backgroundColor: colors.tertiaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },

    summaryLinkText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primaryForeground,
    },

    operationsScrollWrapper: {
      maxHeight: 300,
    },

    operationsScroll: {
      flexGrow: 0,
    },

    operationsList: {
      gap: 10,
      paddingBottom: 2,
    },

    operationCard: {
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    operationTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },

    operationTitleBlock: {
      flex: 1,
      marginRight: 12,
    },

    operationTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 4,
    },

    operationStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },

    operationStatusText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondaryText,
    },

    operationMeta: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 4,
    },

    operationActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
    },

    primaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 14,
      backgroundColor: colors.primaryForeground,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flex: 1,
    },

    primaryActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.buttonText,
    },

    secondaryActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minWidth: 86,
    },

    secondaryActionText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryText,
    },

    viewMoreButton: {
      marginTop: 10,
      alignSelf: 'flex-start',
      paddingVertical: 4,
    },

    viewMoreText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
  });
};

export default dynamicStyles;