import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeColors = {
  background: string;
  text: string;
  subtext: string;
  border: string;
  card: string;
};

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
  fonts: { body: string, bold: string, heading:  string };
};

const ThemeContext = createContext<ThemeContextValue>({
  colors: {
    background: "#F9FAFB",
    text: "#111827",
    subtext: "#6B7280",
    border: "#E5E7EB",
    card: "#FFFFFF",
  },
  isDark: false,
  toggleTheme: () => {},
  fonts: { body: "System", bold: "System", heading: "System" }, // 🔥 Bunu əlavə et
});


const STORAGE_KEY = "app_theme_mode";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isDark, setIsDark] = useState(false);

  // === Sistemdəki rejimə bax (ilk açılışda)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsDark(stored === "dark");
        } else {
          const system = Appearance.getColorScheme();
          setIsDark(system === "dark");
        }
      } catch (err) {
        console.warn("Tema oxunmadı:", err);
      }
    })();
  }, []);

  // === Tema dəyişdirici
  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch (err) {
      console.warn("Tema saxlanmadı:", err);
    }
  };

  const lightColors: ThemeColors = {
    background: "#F9FAFB",
    text: "#111827",
    subtext: "#6B7280",
    border: "#E5E7EB",
    card: "#FFFFFF",
  };

  const darkColors: ThemeColors = {
    background: "#0F172A",
    text: "#F1F5F9",
    subtext: "#94A3B8",
    border: "#1E293B",
    card: "#1E293B",
  };

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        colors,
        isDark,
        toggleTheme,
        fonts: { body: "System", bold: "System", heading: "System" },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
