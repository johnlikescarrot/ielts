import type { Locale } from '../core/types';
import { messages, type MessageKey } from './messages';

export type TranslationParameters = Readonly<Record<string, string | number>>;

export function translate(
  locale: Locale,
  key: MessageKey,
  parameters: TranslationParameters = {},
): string {
  return messages[locale][key].replace(/\{(\w+)\}/gu, (placeholder, name: string) =>
    name in parameters ? String(parameters[name]) : placeholder,
  );
}

export function translator(locale: Locale) {
  return (key: MessageKey, parameters?: TranslationParameters): string =>
    translate(locale, key, parameters);
}

export { messages, type MessageKey } from './messages';
