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
    if (ios) setIsIOSDevice(true);
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
      className={`mt-auto flex-shrink-0 text-center text-gray-400 bg-space-dark/95 backdrop-blur-sm border-t border-gray-800/50 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] leading-tight
        max-sm:pt-1 max-sm:pb-[max(0.375rem,env(safe-area-inset-bottom))] max-sm:text-[10px]
        sm:pt-2 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:text-xs
        md:text-sm
        ${isIOSDevice ? 'pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] text-[10px]' : ''}`}
    >
      {installHint === 'ios' && (
        <p className="text-amber-200/90 text-[10px] mb-0.5 px-2">
          {t('home.installIos')}
        </p>
      )}
      {installHint === 'android' && (
        <p className="text-amber-200/90 text-xs mb-1.5 px-2">
          {t('home.installAndroid')}
        </p>
      )}
      <p>{t('home.footer')}</p>
      <p className={`text-gray-500 mt-0.5 ${isIOSDevice ? 'text-[10px]' : 'max-sm:text-[10px] sm:text-xs'}`}>
        {t('home.version')} {version}
      </p>
    </footer>
  );
}

export default Footer;
