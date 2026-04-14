import React from 'react';
import { View, Text, StyleProp, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import { useTheme } from '../../dopebase';
import FacePileCircleItem from './FacePileCircleItem';
import dynamicStyles from './styles';

type FaceType = string | Record<string, any>;

type RenderFacePileResult = {
  facesToRender: FaceType[];
  overflow: number;
};

type FacePileProps = {
  faces?: FaceType[];
  numFaces?: number;
  hideOverflow?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  circleStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  overflowStyle?: StyleProp<ViewStyle>;
  overflowLabelStyle?: StyleProp<TextStyle>;
  circleSize?: number;
  offset?: number;
};

export function renderFacePile(
  faces: FaceType[] = [],
  numFaces: number = 4,
): RenderFacePileResult {
  const entities = [...faces].reverse();

  if (!entities.length) {
    return {
      facesToRender: [],
      overflow: 0,
    };
  }

  const facesWithImageUrls = entities;

  if (!facesWithImageUrls.length) {
    return {
      facesToRender: [],
      overflow: 0,
    };
  }

  const facesToRender = facesWithImageUrls.slice(0, numFaces);
  const overflow = entities.length - facesToRender.length;

  return {
    facesToRender,
    overflow,
  };
}

export default function FacePile({
  faces = [],
  numFaces = 4,
  hideOverflow = false,
  containerStyle,
  circleStyle,
  imageStyle,
  overflowStyle,
  overflowLabelStyle,
  circleSize = 12,
  offset = 1,
}: FacePileProps) {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const renderOverflowCircle = (overflow: number) => {
    const innerCircleSize = circleSize * 1.8;
    const marginLeft = circleSize * offset - circleSize / 1.6;

    return (
      <View style={circleStyle}>
        <View
          style={[
            styles.facePileOverflow,
            {
              width: innerCircleSize,
              height: innerCircleSize,
              borderRadius: circleSize,
              marginLeft,
            },
            overflowStyle,
          ]}
        >
          <Text
            style={[
              styles.facePileOverflowLabel,
              {
                fontSize: circleSize * 0.7,
              },
              overflowLabelStyle,
            ]}
          >
            +{overflow}
          </Text>
        </View>
      </View>
    );
  };

  const renderFace = (face: FaceType, index: number) => {
    if (!face) {
      return null;
    }

    return (
      <FacePileCircleItem
        dynamicStyle={styles}
        key={index}
        face={face}
        circleStyle={circleStyle}
        imageStyle={imageStyle}
        circleSize={circleSize}
        offset={offset}
      />
    );
  };

  const { facesToRender, overflow } = renderFacePile(faces, numFaces);

  return (
    <View style={[styles.facePileContainer, containerStyle]}>
      {overflow > 0 && !hideOverflow ? renderOverflowCircle(overflow) : null}
      {Array.isArray(facesToRender) ? facesToRender.map(renderFace) : null}
    </View>
  );
}