import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const LOCALE_LABELS = { es: '🇪🇸', pt: '🇵🇹' };

export default function LanguageSelector() {
  const { locale, setLocale, supportedLocales } = useLanguage();

  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-space-blue/90 border border-space-cyan/30 p-1.5">
      {supportedLocales.map((loc) => (
        <motion.button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`h-9 w-11 rounded-lg transition-colors active:scale-95 flex items-center justify-center overflow-hidden ${
            locale === loc
              ? 'bg-space-cyan text-space-dark font-semibold shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-space-blue'
          }`}
        >
          <span className="text-2xl leading-none block scale-125" aria-hidden>
            {LOCALE_LABELS[loc] || loc}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
