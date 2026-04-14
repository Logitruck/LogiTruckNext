import { ReactNode, createContext, useContext } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
} from '@react-navigation/native';
import { ThemeProvider, useAppTheme } from '../../theme';

const TranslationContext = createContext({
  localized: (key: string) => key,
});

export const DopebaseProvider = ({
  children,
}: {
  children: ReactNode;
  theme?: unknown;
}) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};

export const TranslationProvider = ({
  children,
}: {
  children: ReactNode;
  translations?: unknown;
}) => {
  return (
    <TranslationContext.Provider
      value={{
        localized: (key: string) => key,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export const ActionSheetProvider = ({
  children,
}: {
  children: ReactNode;
}) => children;

export const extendTheme = (theme: unknown) => theme;

export const useTheme = () => {
  const { theme, appearance } = useAppTheme();

  return {
    appearance,
    theme: {
      ...theme,
      navContainerTheme: {
        light: {
          ...NavigationLightTheme,
          colors: {
            ...NavigationLightTheme.colors,
            ...theme.navContainerTheme.light.colors,
          },
        },
        dark: {
          ...NavigationDarkTheme,
          colors: {
            ...NavigationDarkTheme.colors,
            ...theme.navContainerTheme.dark.colors,
          },
        },
      },
    },
  };
};

export const useTranslations = () => {
  return useContext(TranslationContext);
};

export { BottomSheet };