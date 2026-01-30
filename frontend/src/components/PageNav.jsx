import { useTranslation } from '../hooks/useTranslation';

/**
 * Barra de navegación: Volver (página anterior) y Salir (ir al inicio).
 * showBack=false en Home para ocultar Volver.
 */
function PageNav({ showBack = true, onBack, onExit, className = '' }) {
  const { t } = useTranslation();

  return (
    <nav
      className={`flex items-center justify-between gap-2 min-h-[40px] mb-4 ${className}`}
      aria-label="Navegación"
    >
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary min-h-[40px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          ← {t('common.back')}
        </button>
      ) : (
        <span className="min-w-[44px]" aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onExit}
        className="btn-secondary min-h-[40px] min-w-[44px] px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
      >
        🏠 {t('common.exit')}
      </button>
    </nav>
  );
}

export default PageNav;
