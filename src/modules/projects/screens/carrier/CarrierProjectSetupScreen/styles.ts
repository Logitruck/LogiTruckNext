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
      paddingBottom: 100,
    },

    footerButtonsContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.primaryBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      padding: 12,
    },

    footerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    footerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryForeground,
      paddingVertical: 12,
      paddingHorizontal: 18,
      borderRadius: 12,
      minWidth: 120,
      gap: 6,
    },

    footerButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 14,
    },

    disabledButton: {
      opacity: 0.5,
    },
    loaderContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
  paddingTop: 40,
},

loadingText: {
  marginTop: 12,
  fontSize: 14,
  color: colors.primaryText,
},
  });
};