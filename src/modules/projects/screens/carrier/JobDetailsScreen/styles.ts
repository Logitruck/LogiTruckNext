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
      paddingBottom: 24,
    },
    card: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 14,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 12,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    labelIcon: {
      marginRight: 8,
      marginTop: 2,
      color: colors.primaryText,
    },
    labelText: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primaryText,
    },
    valueText: {
      fontWeight: '400',
      color: colors.primaryText,
    },
    mapContainer: {
      height: 300,
      marginVertical: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    map: {
      flex: 1,
    },
    reassignButton: {
      marginTop: 12,
    },
    reassignText: {
      color: '#2980b9',
      fontWeight: '700',
    },
    linkButton: {
      marginTop: 8,
    },
    linkText: {
      color: '#3498db',
      fontWeight: '700',
    },
  });
};