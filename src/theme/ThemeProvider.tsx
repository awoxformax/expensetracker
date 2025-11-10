import React, { createContext, useContext, useState } from 'react';

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  colors: {
    background: string;
    text: string;
    textMuted: string;
    primary: string;
    card: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      background: isDarkMode ? '#1E293B' : '#F1F5F9',
      text: isDarkMode ? '#F1F5F9' : '#1E293B',
      textMuted: isDarkMode ? '#94A3B8' : '#64748B',
      primary: '#0EA5E9',
      card: isDarkMode ? '#334155' : '#FFFFFF',
    },
    fonts: {
      heading: 'System',
      body: 'System',
    },
  };

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};