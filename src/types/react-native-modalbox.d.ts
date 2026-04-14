declare module 'react-native-modalbox' {
  import * as React from 'react';
  import { ViewStyle } from 'react-native';

  export interface ModalProps {
    isOpen?: boolean;
    onClosed?: () => void;
    position?: 'top' | 'center' | 'bottom';
    swipeToClose?: boolean;
    swipeArea?: number;
    swipeThreshold?: number;
    coverScreen?: boolean;
    backButtonClose?: boolean;
    style?: ViewStyle;
    children?: React.ReactNode;
    animationDuration?: number;
    useNativeDriver?: boolean;
  }

  export default class Modal extends React.Component<ModalProps> {}
}