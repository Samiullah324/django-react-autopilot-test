import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';
import { THEME_STORAGE_KEY } from './context/ThemeContext';
import './styles/global.css';

function initTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  const theme = saved === 'light' || saved === 'dark' ? saved : 'light';
  document.documentElement.setAttribute('data-theme', theme);
}

initTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
