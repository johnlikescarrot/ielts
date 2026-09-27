import { Language } from '../types';

export type TranslationKey = string;

export interface I18nContextValue {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}
