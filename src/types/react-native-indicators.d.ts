declare module 'react-native-indicators' {
  import * as React from 'react';
  import { ViewProps } from 'react-native';

  export type UIActivityIndicatorProps = ViewProps & {
    color?: string;
    size?: number;
    animationDuration?: number;
    count?: number;
  };

  export class UIActivityIndicator extends React.Component<UIActivityIndicatorProps> {}
}