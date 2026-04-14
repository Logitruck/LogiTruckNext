import React, { memo, ReactNode } from 'react';
import {
  Text as RNText,
  StyleProp,
  TextStyle,
} from 'react-native';
import { useSpacing } from '../../../hooks/useSpacing';
import { useDopebase } from '../../../theming';
import dynamicStyles from './styles';

export type TextProps = {
  style?: StyleProp<TextStyle>;
  children?: ReactNode;
  secondary?: boolean;
  h1?: boolean;
  h2?: boolean;
  h3?: boolean;
  uppercase?: boolean;
  lowercase?: boolean;
  bold?: boolean;
  styles?: ReturnType<typeof dynamicStyles>;
  theme?: any;
  appearance?: string;
  [key: string]: any;
};

const Text = (props: TextProps) => {
  const {
    style,
    children,
    secondary,
    h1,
    h2,
    h3,
    uppercase,
    lowercase,
    bold,
    styles,
    theme,
    appearance,
  } = props;

  const spacingStyles = useSpacing(props);

  const textStyles = [
    secondary ? styles?.tnSecondaryText : styles?.tnPrimaryText,
    h1 && { fontSize: theme?.fontSizes?.xxl, fontWeight: theme?.fontWeights?.l },
    h2 && { fontSize: theme?.fontSizes?.xl, fontWeight: theme?.fontWeights?.l },
    h3 && { fontSize: theme?.fontSizes?.l, fontWeight: theme?.fontWeights?.l },
    uppercase && { textTransform: 'uppercase' as const },
    lowercase && { textTransform: 'lowercase' as const },
    ...spacingStyles,
    style,
    bold && { fontWeight: 'bold' as const },
  ];

  return <RNText style={textStyles}>{children}</RNText>;
};

export default memo(useDopebase(Text, dynamicStyles));