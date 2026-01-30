import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'imposter-locale';
const DEFAULT_LOCALE = 'es';
const SUPPORTED_LOCALES = ['es', 'pt'];

const LanguageContext = createContext(null);

function getStoredLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED_LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale);

  const setLocale = useCallback((newLocale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch (e) {
      console.warn('Could not persist locale', e);
    }
  }, []);

  const value = useMemo(
    () => ({ locale, setLocale, supportedLocales: SUPPORTED_LOCALES }),
    [locale, setLocale]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
