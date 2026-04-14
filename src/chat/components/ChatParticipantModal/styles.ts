import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.secondaryBackground,
    },
    closeText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primaryForeground,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },
    headerSpacer: {
      width: 60,
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    avatar: {
      width: 96,
      height: 96,
      borderRadius: 48,
      marginBottom: 16,
      backgroundColor: colors.grey6,
    },
    name: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 8,
      textAlign: 'center',
    },
    email: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 24,
      textAlign: 'center',
    },
    primaryButton: {
      minWidth: 180,
      minHeight: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
      paddingHorizontal: 20,
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.buttonText,
    },
  });
};