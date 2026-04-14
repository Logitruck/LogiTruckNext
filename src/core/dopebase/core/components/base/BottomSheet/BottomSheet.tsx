import React, { forwardRef } from 'react';
import { SafeAreaView } from 'react-native';
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
};

const BottomSheet = forwardRef<BottomSheetModal, BottomSheetProps>(
  (
    {
      handleSheetChanges,
      animateOnMount = true,
      handleComponent = null,
      snapPoints,
      children,
    },
    myRef,
  ) => {
    const { theme, appearance } = useTheme();
    const styles = dynamicStyles(theme, appearance);

    return (
      <BottomSheetModalProvider>
        <BottomSheetModal
          ref={myRef}
          index={1}
          animateOnMount={animateOnMount}
          backgroundStyle={styles.background}
          snapPoints={snapPoints ?? ['25%', '50%']}
          handleComponent={handleComponent ?? undefined}
          style={styles.bottomSheet}
          onChange={handleSheetChanges}
        >
          <SafeAreaView style={styles.container}>{children}</SafeAreaView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    );
  },
);

BottomSheet.displayName = 'BottomSheet';

export { BottomSheetTextInput, BottomSheet };