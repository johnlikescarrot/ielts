import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import '../../styles/global.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppTheme } from '../shared/AppTheme';
import { PopupApp } from './PopupApp';

const root = document.querySelector('#root');
if (!root) throw new Error('IELTS Forge popup root element was not found.');

createRoot(root).render(
  <StrictMode>
    <AppTheme>
      <PopupApp />
    </AppTheme>
  </StrictMode>,
);
