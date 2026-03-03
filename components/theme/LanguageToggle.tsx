// app/components/theme/LanguageToggle.tsx
"use client";
import { useLanguage } from "@/app/context/LanguageContext";

export function LanguageToggle() {
  const { lang, toggle } = useLanguage();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium
                 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
    >
      {lang === "en" ? "FR" : "EN"}
    </button>
  );
}