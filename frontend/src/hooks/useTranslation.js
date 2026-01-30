import { useCallback, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import es from '../locales/es.json';
import pt from '../locales/pt.json';

const messagesByLocale = { es, pt };

function getNested (obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[key];
  }
  return current;
}

function interpolate (str, vars = {}) {
  if (typeof str !== 'string') return str;
  return str.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] != null ? String(vars[key]) : `{${key}}`
  );
}

/** Capitaliza la primera letra de cada palabra (español y portugués). */
function capitalizeWords (str) {
  if (typeof str !== 'string') return str;
  return str.replace(/(^|[\s\u00A0])([\p{L}])/gu, (_, prefix, letter) => prefix + letter.toUpperCase());
}

export function useTranslation () {
  const { locale } = useLanguage();
  const dict = useMemo(
    () => messagesByLocale[locale] || messagesByLocale.es,
    [locale]
  );

  const t = useCallback(
    (key, vars) => {
      const value = getNested(dict, key);
      if (value == null) return key;
      if (typeof value !== 'string') return key;
      const interpolated = interpolate(value, vars);
      return capitalizeWords(interpolated);
    },
    [dict]
  );

  return { t, locale };
}
