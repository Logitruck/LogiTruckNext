import { useContext } from 'react';
import {
  TranslationContext,
} from '../localization/i18n';

type TranslationContextValue = {
  localized: (key: string, config?: Record<string, any>) => string;
  setAppLocale: (locale: string) => void;
  locale: string;
};

export const useTranslations = (): TranslationContextValue => {
  return useContext(TranslationContext);
};