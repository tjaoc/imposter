import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const LOCALE_LABELS = { es: '🇪🇸', pt: '🇵🇹' };

export default function LanguageSelector() {
  const { locale, setLocale, supportedLocales } = useLanguage();

  return (
    <div className="flex items-center gap-2 rounded-xl bg-space-blue/90 border border-space-cyan/30 p-1.5">
      {supportedLocales.map((loc) => (
        <motion.button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`min-h-[48px] min-w-[52px] px-3 py-2 rounded-xl text-lg transition-colors active:scale-95 ${
            locale === loc
              ? 'bg-space-cyan text-space-dark font-semibold shadow-md'
              : 'text-gray-400 hover:text-white hover:bg-space-blue'
          }`}
        >
          {LOCALE_LABELS[loc] || loc}
        </motion.button>
      ))}
    </div>
  );
}
