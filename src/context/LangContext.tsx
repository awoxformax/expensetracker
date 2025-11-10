import React, { createContext, useState, useContext, useEffect } from "react";
import { getItem, setItem } from "@/src/lib/storage";
const LangContext = createContext<any>(null);

export function LangProvider({ children }: any) {
  const [lang, setLang] = useState("az");
  useEffect(() => { (async () => setLang(await getItem("appLang", "az")))(); }, []);
  const changeLang = async (code: string) => { setLang(code); await setItem("appLang", code); };
  return <LangContext.Provider value={{ lang, changeLang }}>{children}</LangContext.Provider>;
}
export const useLang = () => useContext(LangContext);
