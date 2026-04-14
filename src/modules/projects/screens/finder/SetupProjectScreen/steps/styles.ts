import { StyleSheet } from 'react-native';

export const dynamicStepStyles = (
  theme: any,
  appearance: 'light' | 'dark'
) => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    stepContainer: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.primaryBackground,
    },

    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryText,
      marginBottom: 8,
      marginTop: 12,
    },

    input: {
      minHeight: 48,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primaryText,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    textArea: {
      minHeight: 110,
      textAlignVertical: "top",
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primaryText,
      marginBottom: 12,
    },

    helperText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 6,
    },

    card: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 10,
    },

    cardSelected: {
      borderColor: colors.primaryForeground,
      borderWidth: 2,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.primaryText,
    },

    cardSubtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
    },

    confirmButton: {
      marginTop: 20,
      minHeight: 48,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryForeground,
    },

    confirmButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.buttonText,
    },

    itemText: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 6,
    },

    routeCard: {
      marginBottom: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    routeTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.primaryText,
      marginBottom: 12,
    },
  });
};