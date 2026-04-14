import Button from './components/base/Button';
import EmptyStateView from './components/base/EmptyStateView/EmptyStateView';
import Text from './components/base/Text';
import View from './components/base/View';

import { TranslationProvider } from './localization/i18n';
import {
  useActionSheet,
  ActionSheetProvider,
} from './components/base/ActionSheet';
import {
  BottomSheet,
  BottomSheetTextInput,
} from './components/base/BottomSheet';
import { KeyboardAvoidingView } from './components/base/KeyboardAvoidingView';

import theme, {
  extendTheme,
  useDopebase,
  DopebaseProvider,
  DopebaseContext,
  useTheme,
} from './theming';

import { useTranslations } from './hooks/useTranslations';

export {
  ActionSheetProvider,
  BottomSheet,
  BottomSheetTextInput,
  Button,
  DopebaseContext,
  DopebaseProvider,
  EmptyStateView,
  KeyboardAvoidingView,
  Text,
  TranslationProvider,
  View,
  extendTheme,
  theme,
  useActionSheet,
  useDopebase,
  useTheme,
  useTranslations,
};