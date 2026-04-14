import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center",
      padding: 16,
    },
    modalContent: {
      maxHeight: "80%",
      borderRadius: 18,
      padding: 16,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primaryText,
      marginBottom: 12,
    },
    loader: {
      marginVertical: 12,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 10,
    },
    docInfo: {
      flex: 1,
    },
    docTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primaryText,
      marginBottom: 4,
    },
    docDate: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    smallButton: {
      minHeight: 34,
      paddingHorizontal: 12,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    smallButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.primaryText,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 14,
      color: colors.secondaryText,
      marginVertical: 24,
    },
    cancelButton: {
      marginTop: 16,
      minHeight: 46,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryForeground,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.buttonText,
    },

    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },

    emptyStateContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 24,
    },

    emptySubtext: {
      fontSize: 13,
      color: colors.secondaryText,
      textAlign: "center",
      marginTop: 8,
      marginBottom: 16,
    },

    uploadButton: {
      minHeight: 38,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryForeground,
    },

    uploadButtonText: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.buttonText,
    },
  });
};