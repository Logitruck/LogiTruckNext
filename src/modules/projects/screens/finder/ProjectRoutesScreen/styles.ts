import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    loaderContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    list: {
      padding: 16,
      paddingBottom: 24,
    },
    card: {
      padding: 16,
      borderRadius: 16,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 6,
    },
    cardSubtitle: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 12,
    },
    cardMeta: {
  fontSize: 12,
  color: colors.secondaryText,
  marginTop: 4,
},
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    editLabel: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },
    emptyText: {
      textAlign: 'center',
      marginTop: 40,
      fontSize: 14,
      color: colors.secondaryText,
    },
  });
};