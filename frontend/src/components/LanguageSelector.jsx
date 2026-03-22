import { memo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { m } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';
import { useMotionReduce, motionGestures } from '../game/motionReduce';

const LOCALE_LABELS = { es: '🇪🇸', pt: '🇵🇹' };
const LOCALE_NAMES = { es: 'Español', pt: 'Português' };

function LanguageSelector () {
  const { t } = useTranslation();
  const { locale, setLocale, supportedLocales } = useLanguage();
  const reduce = useMotionReduce();

  return (
    <div className="flex items-center gap-1 rounded-2xl bg-space-blue/90 border border-space-cyan/40 p-1">
      {supportedLocales.map((loc) => (
        <m.button
          key={loc}
          type="button"
          onClick={() => setLocale(loc)}
          aria-label={t('common.switchLanguage', { lang: LOCALE_NAMES[loc] })}
          {...motionGestures(reduce, { hover: 1.05, tap: 0.98 })}
          className={`min-h-[40px] min-w-[44px] flex-1 flex items-center justify-center rounded-xl transition-colors active:scale-95 overflow-hidden ${
            locale === loc
              ? 'bg-space-cyan text-space-dark font-semibold shadow-md'
              : 'bg-transparent text-gray-400 hover:text-white'
          }`}
        >
          <span className="text-2xl leading-none block scale-125" aria-hidden>
            {LOCALE_LABELS[loc] || loc}
          </span>
        </m.button>
      ))}
    </div>
  );
}

export default memo(LanguageSelector);
