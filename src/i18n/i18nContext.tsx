import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language } from '../types';
import { I18nContextValue } from './types';
import { en } from './en';
import { vi } from './vi';
import { storageService } from '../storage/storageService';

const translations: Record<Language, Record<string, string>> = {
  en,
  vi,
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    storageService.getSettings().then(settings => {
      if (settings && (settings.language === 'en' || settings.language === 'vi')) {
        setLanguageState(settings.language);
      }
    });
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    await storageService.updateSettings({ language: newLang });
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if rendered outside provider (useful for isolated unit tests)
    return {
      language: 'en',
      setLanguage: async () => {},
      t: (key: string) => en[key] || key,
    };
  }
  return context;
};
