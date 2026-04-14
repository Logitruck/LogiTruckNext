import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import IndicatorDot from './IndicatorDot';

type TypingIndicatorProps = {
  dotRadius?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TypingIndicator({
  dotRadius = 5,
  containerStyle,
}: TypingIndicatorProps) {
  return (
    <View style={containerStyle}>
      <IndicatorDot radius={dotRadius} startTime={0} />
      <IndicatorDot radius={dotRadius} startTime={500} />
      <IndicatorDot radius={dotRadius} startTime={1000} />
    </View>
  );
}

export default TypingIndicator;