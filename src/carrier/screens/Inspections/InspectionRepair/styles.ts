import { Platform, StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 28,
    },

    loaderContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: 24,
    },

    infoText: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 8,
    },

    label: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.primaryText,
      marginTop: 8,
      marginBottom: 8,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.hairline || "#D1D5DB",
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: Platform.OS === "ios" ? 12 : 10,
      fontSize: 14,
      color: colors.primaryText,
      backgroundColor: colors.card || colors.primaryBackground,
    },

    groupHeader: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primaryText,
      marginTop: 18,
      marginBottom: 10,
    },

    checklistContainer: {
      marginBottom: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline || "#E5E7EB",
      backgroundColor: colors.card || colors.primaryBackground,
      overflow: "hidden",
    },

    checklistItem: {
      paddingHorizontal: 14,
      paddingVertical: 14,
    },

    faultInfoContainer: {
      marginBottom: 12,
    },

    faultText: {
      fontSize: 14,
      color: "#DC2626",
      marginTop: 6,
      fontWeight: "600",
    },

    solutionText: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 6,
    },

    controlsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    switchStyle: {
      marginRight: 12,
    },

    problemButton: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 80,
    },

    boldText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primaryText,
      marginTop: 4,
      textAlign: "center",
    },

    noFaultText: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: "center",
      marginTop: 12,
      marginBottom: 12,
    },

    decisionSection: {
      marginTop: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline || "#E5E7EB",
      backgroundColor: colors.card || colors.primaryBackground,
    },

    radioContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
    },

    radioLabel: {
      flex: 1,
      marginLeft: 10,
      fontSize: 14,
      color: colors.primaryText,
    },

    buttonStyle: {
      backgroundColor: colors.primaryForeground,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 18,
    },

    backButton: {
      flex: 1,
      backgroundColor: colors.secondaryBackground || "#9CA3AF",
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },

    buttonText: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
      textAlign: "center",
    },

    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      paddingHorizontal: 20,
    },

    modalView: {
      backgroundColor: colors.primaryBackground,
      borderRadius: 18,
      padding: 16,
    },

    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.primaryText,
      marginBottom: 10,
    },

    textInputContainer: {
      marginBottom: 8,
    },

    buttonContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      marginTop: 16,
    },
    secondaryActionButton: {
      marginTop: 12,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
    },

    secondaryActionText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryText,
    },
  });
};

export default dynamicStyles;