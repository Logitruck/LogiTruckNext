import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDopebase } from '../../../theming';
import dynamicStyles from './styles';

type KeyboardAvoidingViewProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  verticalOffset?: number;
};

const KeyboardAvoidingView = ({
  children,
  style,
  verticalOffset = 0,
}: KeyboardAvoidingViewProps) => {
  const insets = useSafeAreaInsets();

  const containerProps = useMemo(() => {
    if (Platform.OS === 'android') {
      return {
        behavior: 'height' as const,
        style,
      };
    }

    if (Platform.OS === 'ios') {
      return {
        behavior: 'padding' as const,
        enabled: true,
        style,
        keyboardVerticalOffset:
          verticalOffset + 46 + Math.max(insets.bottom, 16),
      };
    }

    return {
      style,
    };
  }, [style, verticalOffset, insets.bottom]);

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return <>{children}</>;
  }

  return (
    <RNKeyboardAvoidingView {...containerProps}>
      {children}
    </RNKeyboardAvoidingView>
  );
};

export default React.memo(
  useDopebase(KeyboardAvoidingView, dynamicStyles),
);