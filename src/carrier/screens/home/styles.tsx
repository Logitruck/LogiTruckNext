import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.secondaryBackground,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    notificationsSection: {
      marginTop: 10,
      marginHorizontal: 16,
      marginBottom: 20,
    },
    notificationItem: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
    notificationText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    notificationTime: {
      color: colors.secondaryText,
      fontSize: 12,
      marginTop: 4,
    },
    cardGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginHorizontal: 16,
      marginTop: 16,
    },
    jobsSection: {
      marginHorizontal: 16,
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
    },
    quickActionsSection: {
      marginHorizontal: 16,
      marginTop: 20,
      padding: 16,
      borderRadius: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
      color: colors.primaryText,
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
    },
    dashboardCardsContainer: {
      marginTop: 8,
      marginBottom: 0,
      paddingHorizontal: 0,
      gap: 16, // 🔵 Espacio bonito entre sections Offers e Inspections
    },
  });
};

export default dynamicStyles;
