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
      paddingBottom: 32,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
    },
    section: {
      marginBottom: 18,
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
        emptyText: {
      textAlign: "center",
      fontSize: 14,
      color: colors.secondaryText,
      marginVertical: 24,
    },
    jobTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 4,
    },
    jobSubtitle: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    selectCard: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primaryBackground,
      marginBottom: 8,
    },
    selectCardSelected: {
      borderColor: colors.primaryForeground,
      borderWidth: 2,
    },
    selectCardLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },
    selectCardValue: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
    },
    summarySection: {
      marginBottom: 18,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryText: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 6,
    },
    confirmButton: {
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colors.primaryForeground,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    disabledButton: {
      opacity: 0.6,
    },
  });
};