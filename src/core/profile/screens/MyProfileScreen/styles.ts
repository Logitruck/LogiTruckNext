import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.primaryBackground },
    content: { padding: 20, paddingBottom: 40 },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.secondaryText,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginTop: 24,
      marginBottom: 8,
    },
    label: { fontSize: 13, color: colors.secondaryText, marginBottom: 4, marginTop: 12 },
    input: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 15,
      color: colors.primaryText,
    },
    placeholder: { color: colors.secondaryText },
    readOnly: {
      fontSize: 15,
      color: colors.primaryText,
      paddingVertical: 11,
      paddingHorizontal: 14,
      backgroundColor: colors.secondaryBackground,
      borderRadius: 10,
      opacity: 0.6,
    },
    languageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
    languageButton: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.hairline || colors.grey3,
      backgroundColor: colors.secondaryBackground,
    },
    languageButtonActive: {
      backgroundColor: colors.primaryForeground || colors.tintColor || '#1D72F5',
      borderColor: 'transparent',
    },
    languageButtonText: { fontSize: 14, color: colors.primaryText },
    languageButtonTextActive: { color: '#fff', fontWeight: '600' },
    errorText: { color: colors.red || '#E53E3E', fontSize: 13, marginTop: 12 },
    saveButton: {
      marginTop: 28,
      backgroundColor: colors.primaryForeground || colors.tintColor || '#1D72F5',
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveButtonDisabled: { opacity: 0.5 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  });
};
