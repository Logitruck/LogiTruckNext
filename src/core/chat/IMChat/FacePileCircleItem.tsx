import React from 'react';
import {
  Animated,
  StyleProp,
  ImageStyle,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';

type FaceType = string | { uri?: string };

type FacePileCircleItemProps = {
  imageStyle?: StyleProp<ImageStyle>;
  circleStyle?: StyleProp<ViewStyle>;
  circleSize: number;
  face: FaceType;
  offset: number;
  dynamicStyle: any;
};

export default function FacePileCircleItem({
  imageStyle,
  circleStyle,
  circleSize,
  face,
  offset,
  dynamicStyle,
}: FacePileCircleItemProps) {
  const innerCircleSize = circleSize * 2;
  const marginRight = circleSize * offset;

  const uri = typeof face === 'string' ? face : face?.uri || '';

  return (
    <Animated.View style={[{ marginRight: -marginRight }, circleStyle]}>
      <Image
        style={[
          dynamicStyle.facePileCircleImage,
          {
            width: innerCircleSize,
            height: innerCircleSize,
            borderRadius: circleSize,
          },
          imageStyle,
        ]}
        source={{ uri }}
      />
    </Animated.View>
  );
}