import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.primaryBackground,
    },
    headerTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 8,
    },
    headerTitleText: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
    },
    whereTitleBox: {
      justifyContent: 'space-between',
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    },
    whereTitleText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginBottom: 8,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchIcon: {
      width: 18,
      height: 18,
      tintColor: colors.secondaryText,
      marginRight: 8,
    },
    searchLabel: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    locationItemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
      backgroundColor: colors.primaryForeground,
    },
    destinationText: {
      fontSize: 14,
      color: colors.primaryText,
    },
    secondaryLocationText: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },

    packageTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },

    routesList: {
      maxHeight: 180,
      marginBottom: 12,
    },

    routeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },

    routeCardContent: {
      flex: 1,
      marginRight: 10,
    },

    routeCardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },

    routeCardSubtitle: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
    },

    routeDeleteButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
    },

    reviewPackageButton: {
      minHeight: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
      marginTop: 4,
    },

    reviewPackageButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#fff',
    },
  });
};