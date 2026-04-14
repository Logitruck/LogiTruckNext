import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    contentContainer: {
      padding: 16,
      paddingBottom: 40,
    },

    section: {
      marginBottom: 20,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    sectionHeader: {
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },

    headerActions: {
      flexDirection: 'row',
      gap: 10,
      flexWrap: 'wrap',
    },

    secondaryAction: {
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    secondaryActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primaryText,
    },

    primaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 38,
      paddingHorizontal: 12,
      borderRadius: 10,
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },

    primaryActionText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.buttonText,
    },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },

    cardInfo: {
      flex: 1,
      paddingRight: 12,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
    },

    cardMeta: {
      marginTop: 4,
      fontSize: 13,
      color: colors.secondaryText,
    },

    removeButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 8,
    },

    savingBar: {
      padding: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.secondaryBackground,
    },

    savingText: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },
    // 🔹 LOADING
    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },
  });
};

export default dynamicStyles;