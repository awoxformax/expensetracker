import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STRINGS, SupportedLang, TranslationKey, translate } from "../data/strings";

type LangContextValue = {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
};

const LangContext = createContext<LangContextValue>({
  lang: "az",
  setLang: () => {},
  t: (key: TranslationKey) => STRINGS.az[key] ?? key,
});

const STORAGE_KEY = "app_language";

export const LangProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<SupportedLang>("az");

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && Object.prototype.hasOwnProperty.call(STRINGS, stored)) {
          setLangState(stored as SupportedLang);
        }
      } catch (err) {
        console.warn("Dil oxunmadi:", err);
      }
    })();
  }, []);

  const setLang = async (newLang: SupportedLang) => {
    setLangState(newLang);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, newLang);
    } catch (err) {
      console.warn("Dil saxlanmadi:", err);
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string =>
    translate(lang, key, params);

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
};

export const useLang = () => useContext(LangContext);
