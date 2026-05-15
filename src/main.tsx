import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/i18n'; // Must initialize before App renders so first paint has translations
import App from './App';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
