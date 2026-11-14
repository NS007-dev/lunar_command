import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// Order matters: later files override earlier ones, exactly as in the original stylesheet.
import './styles/base.css';
import './styles/intro.css';
import './styles/gadgets.css';
import './styles/mission.css';
import './styles/results.css';
import './styles/tags.css';
import './styles/events.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
