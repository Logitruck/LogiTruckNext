import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    map: {
      flex: 1,
    },
    truckMarker: {
      width: 46,
      height: 46,
      borderRadius: 23,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
      borderWidth: 3,
      borderColor: '#000000',
    },
    floatingCenterButton: {
      position: 'absolute',
      right: 20,
      bottom: 320,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryBackground,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
    bottomPanel: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 24,
      backgroundColor: colors.primaryBackground,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingTop: 22,
      paddingBottom: 20,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.primaryText,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 15,
      color: colors.secondaryText,
      lineHeight: 24,
      marginBottom: 6,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      marginTop: 2,
    },
    statusDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 10,
    },
    statusText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.primaryText,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 14,
      gap: 12,
    },
    button: {
      flex: 1,
      minHeight: 58,
      borderRadius: 18,
      backgroundColor: colors.primaryForeground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      gap: 8,
    },
    buttonText: {
      color: colors.buttonText,
      fontSize: 16,
      fontWeight: '700',
    },
    buttonSecondary: {
      minWidth: 120,
      minHeight: 58,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
      gap: 8,
    },
    buttonSecondaryText: {
      color: colors.primaryText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
};

export default dynamicStyles;