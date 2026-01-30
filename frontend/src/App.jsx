import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useTranslation } from './hooks/useTranslation';
import Footer from './components/Footer';

const Home = lazy(() => import('./pages/Home'));
const Room = lazy(() => import('./pages/Room'));
const Game = lazy(() => import('./pages/Game'));
const Local = lazy(() => import('./pages/Local'));
const LocalGame = lazy(() => import('./pages/LocalGame'));

function App() {
  const { t } = useTranslation();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    const onUpdate = () => setShowUpdatePrompt(true);
    window.addEventListener('pwa-update-available', onUpdate);
    return () => window.removeEventListener('pwa-update-available', onUpdate);
  }, []);

  const handleUpdate = () => {
    setShowUpdatePrompt(false);
    if (typeof window.__pwaUpdate === 'function') {
      window.__pwaUpdate();
    }
  };

  return (
    <div className="min-h-full h-full bg-space-dark flex flex-col">
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-content-safe pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-4 tablet:max-w-3xl tablet:mx-auto lg:max-w-4xl">
        <Suspense fallback={<div className="flex-1 flex items-center justify-center min-h-[40vh]" aria-hidden="true"><span className="text-space-cyan animate-pulse">…</span></div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/local" element={<Local />} />
            <Route path="/local/game" element={<LocalGame />} />
            <Route path="/room/:code" element={<Room />} />
            <Route path="/game/:code" element={<Game />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />

      {showUpdatePrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="update-title"
        >
          <div className="card max-w-sm w-full space-y-4">
            <h2 id="update-title" className="text-lg font-bold text-white text-center">
              {t('common.updateAvailable')}
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowUpdatePrompt(false)}
                className="flex-1 min-h-[48px] rounded-xl border border-gray-600 text-gray-300 hover:bg-space-blue font-medium"
              >
                {t('common.close')}
              </button>
              <button
                type="button"
                onClick={handleUpdate}
                className="flex-1 min-h-[48px] rounded-xl btn-primary"
              >
                {t('common.updateNow')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
