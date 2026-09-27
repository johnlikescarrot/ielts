import React from 'react';
import ReactDOM from 'react-dom/client';
import { PopupApp } from './PopupApp';
import { AstryxProvider } from '../designSystem/AstryxProvider';
import '../styles/globals.css';

const rootElement = document.getElementById('popup-root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AstryxProvider>
        <PopupApp />
      </AstryxProvider>
    </React.StrictMode>
  );
}
