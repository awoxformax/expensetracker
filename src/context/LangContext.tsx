import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LangType = "az" | "en" | "ru";

type LangContextValue = {
  lang: LangType;
  setLang: (lang: LangType) => void;
  t: (key: string) => string;
};

const LangContext = createContext<LangContextValue>({
  lang: "az",
  setLang: () => {},
  t: (key: string) => key,
});

const STORAGE_KEY = "app_language";

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<LangType>("az");

  // === Dili yaddaşdan oxu
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && ["az", "en", "ru"].includes(stored)) {
          setLangState(stored as LangType);
        }
      } catch (err) {
        console.warn("Dil oxunmadı:", err);
      }
    })();
  }, []);

  // === Dili dəyiş və yadda saxla
  const setLang = async (newLang: LangType) => {
    setLangState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (err) {
      console.warn("Dil saxlanmadı:", err);
    }
  };

  // === Tərcümə funksiyası
  const translations: Record<LangType, Record<string, string>> = {
    az: {
      home: "Ana səhifə",
      statistics: "Statistika",
      transactions: "Əməliyyatlar",
      more: "Daha çox",
      dark_mode: "Qaranlıq rejim",
      light_mode: "Aydın rejim",
      language: "Dil",
      security_settings: "Tənzimləmələr",
      logout: "Çıxış",
    },
    en: {
      home: "Home",
      statistics: "Statistics",
      transactions: "Transactions",
      more: "More",
      dark_mode: "Dark Mode",
      light_mode: "Light Mode",
      language: "Language",
      security_settings: "Settings",
      logout: "Logout",
    },
    ru: {
      home: "Главная",
      statistics: "Статистика",
      transactions: "Операции",
      more: "Ещё",
      dark_mode: "Тёмная тема",
      light_mode: "Светлая тема",
      language: "Язык",
      security_settings: "Настройки",
      logout: "Выйти",
    },
  };

  const t = (key: string): string => {
    const set = translations[lang];
    return set[key] || key;
  };

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
