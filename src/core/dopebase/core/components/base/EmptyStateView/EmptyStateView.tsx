import React from 'react';
import { View as RNView, StyleProp, ViewStyle } from 'react-native';
import { useDopebase } from '../../../theming';
import Button from '../Button/Button';
import Text from '../Text';
import View from '../View';
import dynamicStyles from './styles';

type EmptyStateConfig = {
  title?: string;
  description?: string;
  callToAction?: string;
  onPress?: () => void;
  imageView?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

type EmptyStateViewProps = {
  emptyStateConfig?: EmptyStateConfig;
  styles?: ReturnType<typeof dynamicStyles>;
};

const EmptyStateView = (props: EmptyStateViewProps) => {
  const { emptyStateConfig, styles } = props;
const {
  title,
  description,
  callToAction,
  onPress,
  imageView,
  containerStyle,
} = emptyStateConfig ?? {};

  return (
    <RNView style={containerStyle}>
      {imageView ? (
        <View style={styles?.imageContainer}>{imageView}</View>
      ) : null}

      {title?.length ? (
        <Text mt4 style={styles?.title}>
          {title}
        </Text>
      ) : null}

      {description?.length ? (
        <Text style={styles?.description}>{description}</Text>
      ) : null}

      {callToAction?.length ? (
        <View style={styles?.buttonOuterContainer}>
          <Button
            text={callToAction}
            containerStyle={styles?.buttonContainer}
            textStyle={styles?.buttonName}
            onPress={onPress}
            mt4
            mb8
            fx1
            ml4
            mr4
          />
        </View>
      ) : null}
    </RNView>
  );
};

export default useDopebase(EmptyStateView, dynamicStyles);