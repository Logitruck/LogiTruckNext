import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colors = theme.colors[appearance];

  return StyleSheet.create({
    cardContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondaryBackground,
      borderRadius: 16,
      padding: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    avatarContainer: {
      marginRight: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.grey6,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    metaContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaText: {
      fontSize: 13,
      color: colors.grey6,
      marginLeft: 4,
    },
    moreIcon: {
      position: 'absolute',
      right: 12,
      top: 12,
      padding: 4,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    chatTitle: {
      flex: 1,
      fontSize: 16,
      fontWeight: '600',
      color: colors.primaryText,
    },
    iconButton: {
      marginLeft: 8,
      padding: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
};