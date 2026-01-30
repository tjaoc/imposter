import { useTranslation } from '../hooks/useTranslation';

function Footer() {
  const { t } = useTranslation();
  const version = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0-beta3';

  return (
    <footer className="fixed bottom-0 left-0 right-0 py-3 text-center text-gray-400 text-sm bg-space-dark/95 backdrop-blur-sm border-t border-gray-800/50 z-10">
      <p>{t('home.footer')}</p>
      <p className="text-gray-500 text-xs mt-1">
        {t('home.version')} {version}
      </p>
    </footer>
  );
}

export default Footer;
