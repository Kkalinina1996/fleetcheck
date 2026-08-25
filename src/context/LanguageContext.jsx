import { createContext, useContext, useState } from 'react'
import { translations } from '../translations/translations'

const LanguageContext = createContext(null)
const STORAGE_KEY = 'fleetcheck_language'

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'de')

  const setLanguage = (nextLanguage) => {
    localStorage.setItem(STORAGE_KEY, nextLanguage)
    setLanguageState(nextLanguage)
  }

  const t = (key) => translations[language]?.[key] || translations.en[key] || key

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

// This hook intentionally lives with its provider so the context API stays together.
// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => useContext(LanguageContext)
