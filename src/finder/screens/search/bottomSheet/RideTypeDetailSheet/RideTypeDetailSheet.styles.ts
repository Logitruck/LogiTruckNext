import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      paddingTop: 10,
      backgroundColor: colors.primaryBackground,
    },
    imageCard: {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      paddingVertical: 8,
      marginBottom: 10,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    image: {
      width: 120,
      height: 72,
    },
    imagePlaceholder: {
      width: 120,
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    imagePlaceholderText: {
      fontSize: 13,
      color: colors.secondaryText,
    },
    contentContainer: {
      alignItems: 'center',
      marginBottom: 14,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
      textAlign: 'center',
    },
    description: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.secondaryText,
      marginBottom: 6,
    },
    metaText: {
      fontSize: 13,
      color: colors.secondaryText,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
      marginTop: 4,
    },
    secondaryButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.primaryText,
      fontSize: 14,
      fontWeight: '600',
    },
    primaryButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
    },
    primaryButtonText: {
      color: colors.buttonText,
      fontSize: 14,
      fontWeight: '600',
    },
  });
};