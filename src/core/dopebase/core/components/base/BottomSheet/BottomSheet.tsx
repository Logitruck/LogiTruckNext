import React, { forwardRef } from 'react';
import { SafeAreaView, StyleProp, ViewStyle } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import { useTheme } from '../../../theming';
import dynamicStyles from './styles';

type BottomSheetProps = {
  handleSheetChanges?: (index: number) => void;
  animateOnMount?: boolean;
  handleComponent?: React.FC<any> | null;
  snapPoints?: Array<string | number>;
  children?: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  backgroundStyle?: StyleProp<ViewStyle>;
  enablePanDownToClose?: boolean;
  enableContentPanningGesture?: boolean;
  enableHandlePanningGesture?: boolean;
};

const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  (
    {
      handleSheetChanges,
      animateOnMount = true,
      handleComponent = null,
      snapPoints,
      children,
      index = 1,
      style,
      backgroundStyle,
      enablePanDownToClose,
      enableContentPanningGesture,
      enableHandlePanningGesture,
    },
    myRef,
  ) => {
    const { theme, appearance } = useTheme();
    const styles = dynamicStyles(theme, appearance);

    return (
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={myRef}
          index={index}
          animateOnMount={animateOnMount}
          backgroundStyle={backgroundStyle ?? styles.background}
          snapPoints={snapPoints ?? ['25%', '50%']}
          handleComponent={handleComponent ?? undefined}
          style={style ?? styles.bottomSheet}
          onChange={handleSheetChanges}
          enablePanDownToClose={enablePanDownToClose}
          enableContentPanningGesture={enableContentPanningGesture}
          enableHandlePanningGesture={enableHandlePanningGesture}
        >
          <SafeAreaView style={styles.container}>{children}</SafeAreaView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

export { BottomSheetTextInput, BottomSheet };