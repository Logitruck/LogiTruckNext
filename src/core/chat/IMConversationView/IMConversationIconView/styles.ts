import { StyleSheet, ViewStyle, ImageStyle } from 'react-native';

const VIEW_WIDTH = 60;
const MULTI_ICON_WIDTH = 40;
const RADIUS_BORDER_WIDTH = 2;
const TOP_ICON_WIDTH = MULTI_ICON_WIDTH + RADIUS_BORDER_WIDTH * 2;
const ONLINE_MARK_WIDTH = 9 + RADIUS_BORDER_WIDTH * 2;

type Theme = {
  colors: {
    [key: string]: {
      primaryBackground: string;
    };
  };
};

type Styles = {
  container: ViewStyle;
  singleParticipation: ViewStyle;
  singleChatItemIcon: ImageStyle;
  onlineMark: ViewStyle;
  multiParticipation: ViewStyle;
  bottomIcon: ImageStyle;
  topIcon: ImageStyle;
  multiPaticipationIcon: ImageStyle;
  middleIcon: ViewStyle;
};

const dynamicStyles = (
  theme: Theme,
  appearance: string,
): Styles => {
  const colorSet = theme.colors[appearance];

  return StyleSheet.create<Styles>({
    container: {},

    singleParticipation: {
      height: VIEW_WIDTH,
      width: VIEW_WIDTH,
    },

    singleChatItemIcon: {
      position: 'absolute',
      height: VIEW_WIDTH,
      width: VIEW_WIDTH,
      borderRadius: VIEW_WIDTH / 2,
      left: 0,
      top: 0,
    },

    onlineMark: {
      position: 'absolute',
      backgroundColor: '#4acd1d',
      height: ONLINE_MARK_WIDTH,
      width: ONLINE_MARK_WIDTH,
      borderRadius: ONLINE_MARK_WIDTH / 2,
      borderWidth: RADIUS_BORDER_WIDTH,
      borderColor: colorSet.primaryBackground,
      right: 1.5,
      bottom: 1,
    },

    multiParticipation: {
      height: VIEW_WIDTH,
      width: VIEW_WIDTH,
    },

    bottomIcon: {
      top: 0,
      right: 0,
    },

    topIcon: {
      left: 0,
      bottom: 0,
      height: TOP_ICON_WIDTH,
      width: TOP_ICON_WIDTH,
      borderRadius: TOP_ICON_WIDTH / 2,
      borderWidth: RADIUS_BORDER_WIDTH,
      borderColor: colorSet.primaryBackground,
    },

    multiPaticipationIcon: {
      position: 'absolute',
      height: MULTI_ICON_WIDTH,
      width: MULTI_ICON_WIDTH,
      borderRadius: MULTI_ICON_WIDTH / 2,
    },

    middleIcon: {
      position: 'absolute',
      width: VIEW_WIDTH * 0.6,
      height: VIEW_WIDTH * 0.6,
      borderRadius: (VIEW_WIDTH * 0.6) / 2,
      alignSelf: 'center',
      top: VIEW_WIDTH * 0.2,
      backgroundColor: colorSet.primaryBackground,
    },
  });
};

export default dynamicStyles;