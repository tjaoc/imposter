import { useTranslation } from '../hooks/useTranslation';

/**
 * Barra de navegación: Volver (página anterior) y Salir (ir al inicio).
 * showBack=false en Home para ocultar Volver.
 */
function PageNav({ showBack = true, onBack, onExit, className = '' }) {
  const { t } = useTranslation();

  return (
    <nav
      className={`flex items-center justify-between gap-3 min-h-[48px] mb-4 ${className}`}
      aria-label="Navegación"
    >
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] min-w-[48px] px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-space-blue/80 active:scale-[0.98] transition-colors flex items-center gap-2"
        >
          ← {t('common.back')}
        </button>
      ) : (
        <span className="min-w-[48px]" aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onExit}
        className="min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-space-blue/80 active:scale-[0.98] transition-colors flex items-center gap-2"
      >
        🏠 {t('common.exit')}
      </button>
    </nav>
  );
}

export default PageNav;
