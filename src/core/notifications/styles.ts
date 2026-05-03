import { StyleSheet } from 'react-native';

const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const isDark = appearance === 'dark';

  const backgroundColor =
    theme.colors?.primaryBackground ||
    theme.colors?.background ||
    (isDark ? '#1D1F24' : '#FFFFFF');

  const titleColor =
    theme.colors?.primaryText ||
    theme.colors?.text ||
    (isDark ? '#FFFFFF' : '#111827');

  const bodyColor =
    theme.colors?.secondaryText ||
    theme.colors?.grey6 ||
    (isDark ? '#D6D8DC' : '#4B5563');

  const closeColor =
    theme.colors?.grey5 ||
    (isDark ? '#BFC4CC' : '#6B7280');

  const borderColor =
    theme.colors?.hairline ||
    theme.colors?.grey3 ||
    (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)');

  return StyleSheet.create({
    container: {
      flex: 1,
    },
    bannerWrapper: {
      position: 'absolute',
      top: 8,
      left: 12,
      right: 12,
      zIndex: 9999,
    },
    banner: {
      minHeight: 74,
      borderRadius: 18,
      backgroundColor,
      paddingVertical: 14,
      paddingLeft: 16,
      paddingRight: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor,
      shadowColor: '#000',
      shadowOpacity: isDark ? 0.28 : 0.14,
      shadowRadius: 12,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      elevation: 10,
    },
    accent: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 4,
      marginRight: 12,
      backgroundColor:
        theme.colors?.primaryColor || theme.colors?.primary || '#2F80ED',
    },
    textContainer: {
      flex: 1,
      paddingRight: 12,
    },
    title: {
      color: titleColor,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 4,
    },
    body: {
      color: bodyColor,
      fontSize: 13,
      lineHeight: 18,
    },
    closeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeText: {
      color: closeColor,
      fontSize: 14,
      fontWeight: '700',
    },
  });
};

export default dynamicStyles;