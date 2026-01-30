import { useLanguage } from '../context/LanguageContext';
import { motion } from 'framer-motion';

const LOCALE_LABELS = { es: '🇪🇸', pt: '🇵🇹' };

export default function LanguageSelector() {
  const { locale, setLocale, supportedLocales } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-2xl bg-space-blue/90 border border-space-cyan/40 p-1">
      {supportedLocales.map((loc) => (
        <motion.button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className={`min-h-[40px] min-w-[44px] flex-1 flex items-center justify-center rounded-xl transition-colors active:scale-95 overflow-hidden ${
            locale === loc
              ? 'bg-space-cyan text-space-dark font-semibold shadow-md'
              : 'bg-transparent text-gray-400 hover:text-white'
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
