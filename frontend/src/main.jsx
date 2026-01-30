import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import App from './App';
import './index.css';

import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  },
  onOfflineReady() {
    // Opcional: mensaje cuando la app está lista para offline
  },
});
if (typeof window !== 'undefined') {
  window.__pwaUpdate = () => updateSW && updateSW(true);
}

const rootElement = document.getElementById('root');

// Suprimir warnings de React 19 hydration solo en desarrollo
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('HydrateFallback') ||
        args[0].includes('initial hydration'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

ReactDOM.createRoot(rootElement).render(
  <BrowserRouter>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </BrowserRouter>
);
