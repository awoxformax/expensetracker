import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type GradientTuple = [string, string];

type ThemeColors = {
  background: string;
  text: string;
  subtext: string;
  textMuted: string;
  border: string;
  card: string;
  primary: string;
  accent: string;
  bgGradient: GradientTuple;
  ctaGradient: GradientTuple;
  introGradients: GradientTuple[];
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
    textMuted: "#94A3B8",
    border: "#E5E7EB",
    card: "#FFFFFF",
    primary: "#2563EB",
    accent: "#7C3AED",
    bgGradient: ["#EEF2FF", "#E0E7FF"],
    ctaGradient: ["#2563EB", "#7C3AED"],
    introGradients: [
      ["#EEF2FF", "#E0E7FF"],
      ["#E0EAFC", "#CFDEF3"],
      ["#E0E7FF", "#F5F3FF"],
      ["#FDE68A", "#FCA5A5"],
    ],
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
    text: "#0F172A",
    subtext: "#6B7280",
    textMuted: "#94A3B8",
    border: "#E5E7EB",
    card: "#FFFFFF",
    primary: "#2563EB",
    accent: "#7C3AED",
    bgGradient: ["#EEF2FF", "#E0E7FF"],
    ctaGradient: ["#2563EB", "#7C3AED"],
    introGradients: [
      ["#EEF2FF", "#E0E7FF"],
      ["#E0EAFC", "#CFDEF3"],
      ["#F5F3FF", "#E0E7FF"],
      ["#FDE68A", "#FCA5A5"],
    ],
  };

  const darkColors: ThemeColors = {
    background: "#0F172A",
    text: "#F1F5F9",
    subtext: "#94A3B8",
    textMuted: "#94A3B8",
    border: "#1E293B",
    card: "#1E293B",
    primary: "#60A5FA",
    accent: "#C084FC",
    bgGradient: ["#0F172A", "#1E293B"],
    ctaGradient: ["#6366F1", "#8B5CF6"],
    introGradients: [
      ["#0F172A", "#1E293B"],
      ["#1E293B", "#312E81"],
      ["#111827", "#020617"],
      ["#312E81", "#7C3AED"],
    ],
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
