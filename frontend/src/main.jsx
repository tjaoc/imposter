import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

// Suprimir warnings específicos de React 19 hydration en desarrollo (SPA sin SSR)
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('HydrateFallback') || args[0].includes('initial hydration'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

ReactDOM.createRoot(rootElement).render(
  <BrowserRouter>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </BrowserRouter>
);
