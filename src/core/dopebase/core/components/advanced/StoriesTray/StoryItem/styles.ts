import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';

const imageContainerWidth = 66;
const imageWidth = imageContainerWidth - 6;

type Styles = {
  container: ViewStyle;
  imageContainer: ViewStyle;
  image: ImageStyle;
  text: TextStyle;
  isOnlineIndicator: ViewStyle;
  verifiedIcon: ImageStyle;
  verifiedContainer: ViewStyle;
};

const dynamicStyles = (theme: any, appearance: string): Styles => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create<Styles>({
    container: {
      alignItems: 'center',
      margin: 8,
      overflow: 'hidden',
    },
    imageContainer: {
      width: imageContainerWidth,
      height: imageContainerWidth,
      borderRadius: Math.floor(imageContainerWidth / 2),
      borderColor: colorSet.primaryForeground,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    image: {
      width: imageWidth,
      height: imageWidth,
      borderRadius: Math.floor(imageWidth / 2),
      borderColor: colorSet.primaryBackground,
      borderWidth: 1,
      overflow: 'hidden',
    },
    text: {
      fontSize: 12,
      textAlign: 'center',
      color: colorSet.secondaryText,
      paddingTop: 5,
    },
    isOnlineIndicator: {
      position: 'absolute',
      backgroundColor: '#4acd1d',
      height: 16,
      width: 16,
      borderRadius: 8,
      borderWidth: 3,
      borderColor: colorSet.primaryBackground,
      right: 5,
      bottom: 0,
    },
    verifiedIcon: {
      width: 18,
      height: 18,
      marginLeft: 3,
    },
    verifiedContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
};

export default dynamicStyles;