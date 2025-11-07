import React, { createContext, useContext, useMemo, useState } from 'react';
import { DEFAULT_PRESET, PresetName, Themes, AppTheme } from './colors';

type ThemeContextType = {
  preset: PresetName;
  colors: AppTheme;
  fonts: { heading: string; body: string };
  setPreset: (p: PresetName) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  preset: DEFAULT_PRESET,
  colors: Themes[DEFAULT_PRESET],
  fonts: { heading: 'DMSans_700Bold', body: 'DMSans_400Regular' },
  setPreset: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [preset, setPreset] = useState<PresetName>(DEFAULT_PRESET);

  const value = useMemo(() => ({
    preset,
    colors: Themes[preset],
    // Use system fonts by default; can be overridden later when custom fonts are available
    fonts: { heading: 'System', body: 'System' },
    setPreset,
  }), [preset]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
