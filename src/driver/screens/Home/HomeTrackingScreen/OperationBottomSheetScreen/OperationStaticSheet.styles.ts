import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: any) => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },

    handle: {
      width: 40,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#ccc',
      alignSelf: 'center',
      marginBottom: 12,
    },

    status: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: 6,
    },

    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
    },

    subtitle: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 16,
    },

    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },

    metric: {
      backgroundColor: colors.grey0 || '#f5f5f5',
      padding: 12,
      borderRadius: 10,
      width: '48%',
    },

    metricLabel: {
      fontSize: 12,
      color: colors.secondaryText,
    },

    metricValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },

    card: {
      backgroundColor: colors.grey0 || '#f5f5f5',
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
    },

    sectionTitle: {
      fontSize: 12,
      color: colors.secondaryText,
      marginBottom: 4,
    },

    contact: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
    },

    phone: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 8,
    },

    callButton: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      borderRadius: 8,
      alignItems: 'center',
    },

    callText: {
      color: '#fff',
      fontWeight: '600',
    },

    actionButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
    },

    actionText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
  });
};

export default dynamicStyles;