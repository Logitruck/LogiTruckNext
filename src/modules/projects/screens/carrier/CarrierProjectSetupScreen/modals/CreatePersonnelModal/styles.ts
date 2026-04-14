import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
     container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
  innerContainer: {
      flex: 1,
      paddingHorizontal: 16,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 16,
      gap: 12,
    },
 headerTextWrap: {
      flex: 1,
      paddingTop: 4,
      paddingRight: 8,
    },

    title: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primaryText,
      lineHeight: 30,
    },

    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 2,
    },

    searchInput: {
      minHeight: 52,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.primaryText,
      marginBottom: 16,
    },

    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 40,
    },    scrollContent: {
      padding: 20,
      paddingBottom: 40,
    },

    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 8,
    },

    helperText: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 20,
      marginBottom: 20,
    },

    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 6,
      marginTop: 12,
    },

    input: {
      minHeight: 48,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primaryText,
    },

    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },

    secondaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    secondaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
    },

    primaryButton: {
      flex: 1,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },

    primaryButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.buttonText,
    },
     listContent: {
      paddingBottom: 32,
    },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 18,
      marginBottom: 14,
      borderRadius: 20,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
     cardInfo: {
      flex: 1,
      paddingRight: 12,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.primaryText,
      lineHeight: 22,
    },

    cardMeta: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 6,
      lineHeight: 18,
      textTransform: 'capitalize',
    },

    iconWrap: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyState: {
      paddingTop: 48,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyText: {
      textAlign: 'center',
      color: colors.secondaryText,
      fontSize: 14,
      lineHeight: 20,
      paddingHorizontal: 24,
    },
    

  });
};

export default dynamicStyles;