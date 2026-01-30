import { useState, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

function Footer() {
  const { t } = useTranslation();
  const [installHint, setInstallHint] = useState(null); // 'ios' | 'android' | null
  const version =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  useEffect(() => {
    if (isIOS() && !window.navigator.standalone) {
      setInstallHint('ios');
    } else if (
      isAndroid() &&
      !window.matchMedia('(display-mode: standalone)').matches
    ) {
      setInstallHint('android');
    }
  }, []);

  return (
    <footer className="fixed left-0 right-0 py-3 text-center text-gray-400 text-sm sm:text-base bg-space-dark/95 backdrop-blur-sm border-t border-gray-800/50 z-10 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] bottom-[env(safe-area-inset-bottom,0px)]">
      {installHint === 'ios' && (
        <p className="text-amber-200/90 text-sm mb-2 px-2">
          {t('home.installIos')}
        </p>
      )}
      {installHint === 'android' && (
        <p className="text-amber-200/90 text-sm mb-2 px-2">
          {t('home.installAndroid')}
        </p>
      )}
      <p>{t('home.footer')}</p>
      <p className="text-gray-500 text-sm mt-1">
        {t('home.version')} {version}
      </p>
    </footer>
  );
}

export default Footer;
