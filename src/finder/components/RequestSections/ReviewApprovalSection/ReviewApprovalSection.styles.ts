import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    mapContainer: {
      height: 240,
      width: '100%',
    },
    card: {
      margin: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: colors.secondaryBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primaryText,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
      marginTop: 16,
      marginBottom: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.primaryText,
      marginBottom: 6,
    },
    acceptButton: {
      marginTop: 20,
      backgroundColor: colors.primaryForeground,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    acceptButtonText: {
      color: colors.buttonText,
      fontWeight: 'bold',
      fontSize: 16,
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
  fontWeight: '700',
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