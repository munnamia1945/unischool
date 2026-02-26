import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for Vercel debugging
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global Error:', message, 'at', source, lineno, colno);
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif;">
      <h2>Runtime Error</h2>
      <p>${message}</p>
      <p>Check the browser console for more details.</p>
    </div>`;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
