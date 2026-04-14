import { StyleSheet } from 'react-native';

export const dynamicStyles = (theme: any, appearance: 'light' | 'dark') => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create({
    tabContainer: {
      marginBottom: 12,
    },
    tabList: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: colorSet.hairline,
      backgroundColor: colorSet.secondaryBackground,
      borderRadius: 12,
    },
    tabItem: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
      marginHorizontal: 4,
      borderRadius: 8,
      minWidth: 70,
    },
    tabItemActive: {
      backgroundColor: colorSet.primaryBackground,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
      elevation: 2,
    },
    tabText: {
      fontSize: 11,
      textAlign: "center",
      color: colorSet.secondaryText,
    },
    badge: {
      marginTop: 4,
      minWidth: 20,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      backgroundColor: colorSet.red,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
    tabContent: {
      marginTop: 8,
    },
  });
};