
export const translations = {
  en: {
    financeDashboardTitle: "Financial Dashboard",
    revenue: "Revenue",
    expenses: "Expenses",
    // ...
    addNewInvoice: "+ New Invoice"
  },
  fr: {
    financeDashboardTitle: "Tableau de Bord Financier",
    revenue: "Chiffre d'Affaires",
    expenses: "Dépenses",
    // ...
    addNewInvoice: "+ Nouvelle Facture"
  }
};

export function t(lang: 'en' | 'fr', key: keyof typeof translations['en']) {
  return translations[lang][key];
}