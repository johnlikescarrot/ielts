import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import './styles.css';
import {App} from './App';
import type {Surface} from './types';

const root = document.querySelector('#root');
if (!root) throw new Error('Bandcraft root element was not found');
const surface = (document.body.dataset.surface ?? 'dashboard') as Surface;
createRoot(root).render(
  <StrictMode>
    <App surface={surface} />
  </StrictMode>,
);
