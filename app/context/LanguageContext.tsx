"use client";

import React, { createContext, useState, useContext } from "react";

type Language = "en" | "fr";
type LangContextType = { lang: Language; toggle: () => void };

const LangContext = createContext<LangContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>("en");

  const toggle = () => setLang((prev) => (prev === "en" ? "fr" : "en"));

  return <LangContext.Provider value={{ lang, toggle }}>{children}</LangContext.Provider>;
};

export const useLanguage = () => {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
