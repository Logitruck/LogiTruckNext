import React, { ReactNode } from 'react';
import {
  View as RNView,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { useSpacing } from '../../../hooks/useSpacing';
import { useDopebase } from '../../../theming';
import dynamicStyles from './styles';

export type ViewProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle | TextStyle | ImageStyle>;
  styles?: ReturnType<typeof dynamicStyles>;
  [key: string]: any;
};

const View = (props: ViewProps) => {
  const { children, style } = props;

  const spacingStyles = useSpacing(props);
  const viewStyles = [...spacingStyles, style];

  return <RNView style={viewStyles}>{children}</RNView>;
};

export default React.memo(useDopebase(View, dynamicStyles));