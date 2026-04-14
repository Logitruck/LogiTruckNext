import React, { createContext, useState } from 'react';

type LocalizedFn = (key: string, config?: Record<string, any>) => string;

type TranslationContextValue = {
  localized: LocalizedFn;
  setAppLocale: (locale: string) => void;
  locale: string;
};

type TranslationProviderProps = {
  children: React.ReactNode;
  translations?: Record<string, any>;
};

const defaultContextValue: TranslationContextValue = {
  localized: (key: string) => key,
  setAppLocale: () => {},
  locale: 'en',
};

export const TranslationContext =
  createContext<TranslationContextValue>(defaultContextValue);

export const TranslationProvider = ({
  children,
  translations = {},
}: TranslationProviderProps) => {
  const [locale, setLocale] = useState<string>('en');

  const localized: LocalizedFn = (key, config = {}) => {
    const localeTranslations = translations?.[locale] || {};
    const value = localeTranslations?.[key];

    if (typeof value === 'string') {
      return value;
    }

    return key;
  };

  return (
    <TranslationContext.Provider
      value={{
        localized,
        setAppLocale: setLocale,
        locale,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};