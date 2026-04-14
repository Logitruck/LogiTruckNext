import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    listContent: {
      paddingBottom: 32,
    },

    mapContainer: {
      width: '100%',
      height: 260,
      backgroundColor: colors.secondaryBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      overflow: 'hidden',
    },

    map: {
      width: '100%',
      height: '100%',
    },

    emptyMap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },

    emptyMapText: {
      marginTop: 10,
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
    },

    headerBlock: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },

    projectName: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.primaryText,
      marginBottom: 6,
    },

    summaryText: {
      fontSize: 14,
      color: colors.secondaryText,
    },

    routeCard: {
      marginHorizontal: 16,
      marginTop: 12,
      padding: 16,
      borderRadius: 18,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    routeCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      gap: 12,
    },

    routeTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.primaryText,
      flex: 1,
    },

    badge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    badgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primaryText,
    },

    routePath: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
      lineHeight: 22,
    },

    routeMeta: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 4,
      lineHeight: 20,
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