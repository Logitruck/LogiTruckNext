import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    contentContainer: {
      padding: 16,
      paddingBottom: 32,
    },

    card: {
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },

    label: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.secondaryText,
      marginTop: 8,
      marginBottom: 6,
    },

    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.primaryText,
      backgroundColor: colors.primaryBackground,
      fontSize: 14,
    },

    textArea: {
      minHeight: 90,
      textAlignVertical: 'top',
    },

    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    chipsColumn: {
      gap: 8,
    },

    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.primaryBackground,
      alignSelf: 'flex-start',
    },

    chipSelected: {
      backgroundColor: colors.primaryForeground,
      borderColor: colors.primaryForeground,
    },

    chipText: {
      color: colors.primaryText,
      fontSize: 12,
      fontWeight: '500',
    },

    chipTextSelected: {
      color: colors.buttonText,
      fontWeight: '600',
    },

    toggleButton: {
      marginTop: 16,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryBackground,
    },

    toggleButtonActive: {
      backgroundColor: colors.primaryForeground,
      borderColor: colors.primaryForeground,
    },

    toggleButtonText: {
      color: colors.buttonText,
      fontWeight: '600',
      fontSize: 13,
    },

    primaryButton: {
      marginTop: 16,
      backgroundColor: colors.primaryForeground,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },

    primaryButtonText: {
      color: colors.buttonText,
      fontWeight: '700',
      fontSize: 14,
    },

    disabledButton: {
      opacity: 0.6,
    },

    emptyText: {
      color: colors.secondaryText,
      fontSize: 13,
    },

    itemCard: {
      padding: 14,
      borderRadius: 14,
      marginBottom: 12,
      backgroundColor: colors.primaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },

    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    itemTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: '700',
      color: colors.primaryText,
      marginRight: 12,
    },

    deleteText: {
      fontSize: 18,
      color: colors.danger,
      fontWeight: '700',
    },

    itemMeta: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
      lineHeight: 18,
    },

    statusRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },

    statusChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.primaryBackground,
    },

    statusChipText: {
      fontSize: 11,
      color: colors.primaryText,
      fontWeight: '500',
    },

    statusPending: {
      backgroundColor: '#fff4db',
      borderColor: '#f5d27a',
    },

    statusSubmitted: {
      backgroundColor: '#e8f1ff',
      borderColor: '#8eb8ff',
    },

    statusApproved: {
      backgroundColor: '#e5f8ec',
      borderColor: '#7cd29c',
    },

    statusRejected: {
      backgroundColor: '#fdeaea',
      borderColor: '#f1a7a7',
    },

    statusMuted: {
      backgroundColor: '#f1f1f1',
      borderColor: '#d4d4d4',
    },
  });
};