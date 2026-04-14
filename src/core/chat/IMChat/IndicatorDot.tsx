import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

type IndicatorDotProps = {
  startTime?: number;
  radius?: number;
};

export default function IndicatorDot({
  startTime = 0,
  radius = 5,
}: IndicatorDotProps) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleAnimation();
    }, startTime);

    return () => {
      clearTimeout(timeout);
      animation.stopAnimation();
    };
  }, [startTime]);

  const handleAnimation = () => {
    Animated.sequence([
      Animated.timing(animation, {
        duration: 500,
        toValue: 1,
        useNativeDriver: false,
      }),
      Animated.timing(animation, {
        duration: 500,
        toValue: 0,
        useNativeDriver: false,
      }),
    ]).start(() => {
      handleAnimation();
    });
  };

  const backgroundColorInterpolation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgb(150, 150, 150)', 'rgb(197,197,200)'],
  });

  const getStyles = () => ({
    width: radius * 2,
    height: radius * 2,
    borderRadius: radius,
    backgroundColor: backgroundColorInterpolation,
    marginHorizontal: 2,
  });

  return <Animated.View style={getStyles()} />;
}