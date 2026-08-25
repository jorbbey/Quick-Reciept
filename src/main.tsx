import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initAnalytics } from './lib/analytics';

// Suppress non-application extension errors (e.g., MetaMask, Coinbase, Phantom injected content scripts failing in sandboxed iframes)
if (typeof window !== 'undefined') {
  const isExtensionNoise = (val: any) => {
    if (!val) return false;
    let str = '';
    try {
      if (typeof val === 'string') str = val;
      else if (val instanceof Error) str = `${val.message} ${val.stack || ''}`;
      else if (typeof val === 'object') str = `${val.message || ''} ${val.reason?.message || ''} ${val.filename || ''} ${JSON.stringify(val)}`;
      else str = String(val);
    } catch {
      str = String(val);
    }
    return /metamask|ethereum|web3|wallet|chrome-extension|moz-extension|evmAsk|coinbase|phantom/i.test(str);
  };

  window.addEventListener('error', (event) => {
    if (isExtensionNoise(event.message) || isExtensionNoise(event.error) || isExtensionNoise(event.filename)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isExtensionNoise(event.reason) || isExtensionNoise(event)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  }, true);
}

// Initialize analytics
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
