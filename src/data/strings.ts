export const STRINGS = {
  az: { home: "Ana səhifə", statistics: "Statistika", transactions: "Əməliyyatlar", more: "Daha çox" },
  en: { home: "Home", statistics: "Statistics", transactions: "Transactions", more: "More" },
  ru: { home: "Главная", statistics: "Статистика", transactions: "Операции", more: "Еще" },
};
export const t = (key: keyof typeof STRINGS["az"], lang: keyof typeof STRINGS) =>
  (STRINGS[lang] as any)?.[key] ?? key;
