import React, { createContext, useContext } from 'react';
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationLightTheme,
} from '@react-navigation/native';

import { ThemeProvider, useAppTheme } from '../../../../theme';
import baseTheme from '../../../../theme/baseTheme';

type AppearanceMode = 'light' | 'dark';

type AppThemeType = typeof baseTheme & {
  navContainerTheme: {
    light: typeof NavigationLightTheme;
    dark: typeof NavigationDarkTheme;
  };
};

type DopebaseContextValue = {
  theme: AppThemeType;
  appearance: AppearanceMode;
};

type DopebaseProviderProps = {
  children?: React.ReactNode;
};

type DynamicStylesFn = (
  theme: AppThemeType,
  appearance: AppearanceMode,
) => any;

type WrappedComponentProps = Record<string, any>;

const buildDopebaseTheme = (theme: typeof baseTheme): AppThemeType => {
  return {
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
  };
};

const defaultContextValue: DopebaseContextValue = {
  theme: buildDopebaseTheme(baseTheme),
  appearance: 'light',
};

export const DopebaseContext =
  createContext<DopebaseContextValue>(defaultContextValue);

export function DopebaseProvider({
  children = null,
}: DopebaseProviderProps) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

export function useDopebase<T extends WrappedComponentProps>(
  Component: React.ComponentType<T>,
  styles?: DynamicStylesFn,
) {
  return function WrappedComponent(props: T) {
    const { theme, appearance } = useTheme();

    return (
      <Component
        {...props}
        theme={theme}
        appearance={appearance}
        styles={styles ? styles(theme, appearance) : undefined}
      />
    );
  };
}

export function extendTheme(theme: Partial<typeof baseTheme>) {
  return {
    ...baseTheme,
    ...theme,
  };
}

export function useTheme(): DopebaseContextValue {
  const { theme, appearance } = useAppTheme();

  return {
    appearance,
    theme: buildDopebaseTheme(theme),
  };
}

export default buildDopebaseTheme(baseTheme);