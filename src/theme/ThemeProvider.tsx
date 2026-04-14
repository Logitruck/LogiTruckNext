import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';
import baseTheme from './baseTheme';

type AppearanceMode = 'light' | 'dark';
type RoleThemeKey = keyof typeof baseTheme.roleThemes;

type ThemeContextType = {
  theme: any;
  appearance: AppearanceMode;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: baseTheme,
  appearance: 'light',
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const systemAppearance = useColorScheme();
  const currentUser = useSelector((state: any) => state.auth?.user);

  const appearance: AppearanceMode =
    systemAppearance === 'dark' ? 'dark' : 'light';

  const role = (currentUser?.role ?? null) as RoleThemeKey | null;

  const theme = useMemo(() => {
    const roleTheme = role ? baseTheme.roleThemes[role] ?? {} : {};

    return {
      ...baseTheme,
      appearance,
      colors: {
        ...baseTheme.colors,
        [appearance]: {
          ...baseTheme.colors[appearance],
          ...roleTheme,
        },
      },
    };
  }, [appearance, role]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        appearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);