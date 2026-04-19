import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

Sentry.init({
  dsn: 'https://71284ee889612136e421be84f8eeb4c4@o294159.ingest.us.sentry.io/4511243973361664',
  sendDefaultPii: true,
});

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
