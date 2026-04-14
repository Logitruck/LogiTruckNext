import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: "light" | "dark") => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: 12,
      paddingTop: 10,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },

    actionButton: {
      minWidth: 84,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryForeground,
    },

    actionButtonText: {
      color: colors.buttonText,
      fontSize: 13,
      fontWeight: "600",
    },
    disabledButton: {
      opacity: 0.5,
    },

    listContentContainer: {
      paddingBottom: 16,
    },
  });
};