import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const LOCALE_LABELS = { es: 'ES', pt: 'Português (PT)' };

export default function LanguageSelector() {
  const { locale, setLocale, supportedLocales } = useLanguage();

  return (
    <div className="flex items-center gap-2 rounded-lg bg-space-blue/80 border border-space-cyan/20 p-1">
      {supportedLocales.map((loc) => (
        <motion.button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            locale === loc
              ? 'bg-space-cyan text-space-dark'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {LOCALE_LABELS[loc] || loc}
        </motion.button>
      ))}
    </div>
  );
}
