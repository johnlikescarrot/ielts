import { describe, expect, it } from 'vitest';
import { messages, translate } from '../src/i18n';

describe('translation', () => {
  it('returns English and Vietnamese message variants', () => {
    expect(translate('en', 'startReview')).toBe('Start review');
    expect(translate('vi', 'startReview')).toBe('Bắt đầu ôn');
  });

  it('falls back to English for an unsupported runtime locale', () => {
    expect(translate('xx' as 'en', 'appName')).toBe(messages.en.appName);
  });
});
