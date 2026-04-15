import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

export const navigate = (
  name: keyof RootStackParamList,
  params?: any
) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
};