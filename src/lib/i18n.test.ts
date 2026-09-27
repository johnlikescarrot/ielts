import {describe, expect, it} from 'vitest';
import {translate} from './i18n';

describe('translations', () => {
  it('defaults to English copy and interpolates every value', () => {
    expect(translate('en', 'planVocabulary', {count: 4})).toBe(
      'Review 4 due cards',
    );
    expect(translate('en', 'words', {count: 12})).toBe('12 words');
  });
  it('returns Vietnamese copy', () => {
    expect(translate('vi', 'dashboard')).toBe('Hôm nay');
  });
});
