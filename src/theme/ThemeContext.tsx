import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { colors } from './colors';
import { typography } from './typography';
import { spacing, radius, shadows } from './spacing';

export type ThemeMode = 'system' | 'light' | 'dark';

interface Theme {
  colors: (typeof colors)['dark'];
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadows: typeof shadows;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const isDark = true;

  const handleSetThemeMode = useCallback((mode: ThemeMode) => {
    setThemeMode(mode);
  }, []);

  const theme = useMemo<Theme>(
    () => ({
      colors: isDark ? colors.dark : colors.light,
      typography,
      spacing,
      radius,
      shadows,
      isDark,
      themeMode,
      setThemeMode: handleSetThemeMode,
    }),
    [isDark, themeMode, handleSetThemeMode]
  );

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
