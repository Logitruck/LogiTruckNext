import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },

    mapContainer: {
      flex: 1,
    },

    loaderContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.primaryBackground,
    },

    emptyText: {
      marginTop: 10,
      color: colors.secondaryText,
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    floatingMenuButton: {
  width: 40,
  height: 40,
  alignItems: 'center',
  justifyContent: 'center',
},

floatingHeaderCenter: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

floatingHeaderRightSpacer: {
  width: 40,
},

    floatingHeader: {
      position: 'absolute',
      top: 58,
      left: 14,
      right: 14,
      borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.96)',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: colors.hairline || '#E5E7EB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 6,
      zIndex: 20,
    },

    floatingHeaderLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primaryText || '#111827',
      textAlign: 'center',
    },

    floatingHeaderSub: {
      fontSize: 13,
      color: colors.secondaryText || '#4B5563',
      textAlign: 'center',
      marginTop: 4,
    },
  });
};

export default dynamicStyles;