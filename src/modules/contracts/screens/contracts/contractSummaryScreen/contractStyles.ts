import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 120,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 16,
    },
    card: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 10,
    },
    cardText: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 6,
    },
    routesHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    routesToggleText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    routeBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 8,
    },
    routeMeta: {
      fontSize: 12,
      color: colors.secondaryText,
      marginBottom: 4,
    },
    emptyStateBox: {
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyStateText: {
      fontSize: 13,
      color: colors.secondaryText,
      textAlign: 'center',
    },
    bottomSpacing: {
      height: 24,
    },
    bottomButtonContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 20,
      backgroundColor: colors.primaryBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    buttonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.buttonText,
    },
  });
};