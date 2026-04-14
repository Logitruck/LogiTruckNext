import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme, BottomSheet } from '../../../../core/dopebase';
import BottomSheetNavigator from  '../../../navigation/BottomSheetNavigator';
import { dynamicStyles } from './BottomSheetScreen.styles';

const BottomSheetScreen = () => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const bottomSheetSnapPoints = useSelector(
    (state: any) => state.bottomSheet?.bottomSheetSnapPoints
  );

  const bottomSheetRef = useRef<any>(null);

  const rawSnapPoints = bottomSheetSnapPoints?.snapPoints;
  const rawIndex = bottomSheetSnapPoints?.index ?? 0;

  const snapPoints =
    Array.isArray(rawSnapPoints) && rawSnapPoints.length > 0
      ? rawSnapPoints
      : ['50%'];

  const maxIndex = snapPoints.length - 1;
  const index = rawIndex >= 0 && rawIndex <= maxIndex ? rawIndex : 0;

  useEffect(() => {
    bottomSheetRef.current?.present?.();
  }, [bottomSheetSnapPoints?.key]);

  const renderHandleComponent = () => (
    <View style={styles.handle} />
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={index}
      snapPoints={snapPoints}
      handleComponent={renderHandleComponent}
      style={styles.sheet}
      animateOnMount={false}
      enablePanDownToClose={false}
      backgroundStyle={styles.background}
      enableContentPanningGesture={true}
      enableHandlePanningGesture={false}
    >
      <View style={styles.content}>
        <BottomSheetNavigator />
      </View>
    </BottomSheet>
  );
};

export default React.memo(BottomSheetScreen);