import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    card: {
      backgroundColor: colors.secondaryBackground,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.primaryText,
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primaryText,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 6,
    },
    listItem: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 4,
    },
    loadingText: {
      fontSize: 14,
      color: colors.secondaryText,
      marginTop: 12,
      textAlign: "center",
    },
    sectionSpacing: {
      marginTop: 18,
    },
    buttonRow: {
      marginTop: 20,
      gap: 10,
    },
    button: {
      backgroundColor: colors.primaryForeground,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    buttonText: {
      color: colors.buttonText,
      fontWeight: "600",
      fontSize: 14,
    },
    routeBox: {
      marginTop: 10,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    routeTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primaryText,
      marginBottom: 6,
    },

    routeMeta: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },
  });
};