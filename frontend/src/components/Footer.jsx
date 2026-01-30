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
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const version =
    typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';

  useEffect(() => {
    const ios = isIOS();
    if (ios) {
      setIsIOSDevice(true);
      document.body.classList.add('ios');
    }
    if (ios && !window.navigator.standalone) {
      setInstallHint('ios');
    } else if (
      isAndroid() &&
      !window.matchMedia('(display-mode: standalone)').matches
    ) {
      setInstallHint('android');
    }
  }, []);

  return (
    <footer
      className="mt-auto flex-shrink-0 text-center text-gray-400 bg-space-dark/95 backdrop-blur-sm border-t border-gray-800/50 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] max-sm:pt-0.5 max-sm:pb-[max(0.25rem,env(safe-area-inset-bottom))] max-sm:text-[9px] max-sm:leading-none sm:pt-2 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:text-xs sm:leading-tight md:text-sm"
    >
      {installHint === 'ios' && (
        <p className="text-amber-200/90 max-sm:text-[9px] max-sm:mb-0.5 sm:text-xs sm:mb-1 px-2">
          {t('home.installIos')}
        </p>
      )}
      {installHint === 'android' && (
        <p className="text-amber-200/90 text-xs mb-1.5 px-2">
          {t('home.installAndroid')}
        </p>
      )}
      <p>{t('home.footer')}</p>
      <p className="text-gray-500 max-sm:mt-0.5 max-sm:text-[9px] sm:mt-0.5 sm:text-xs">
        {t('home.version')} {version}
      </p>
    </footer>
  );
}

export default Footer;
