import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useI18n } from '../../src/i18n/i18nContext';
import { en } from '../../src/i18n/en';
import { vi } from '../../src/i18n/vi';

const TestComponent = () => {
  const { language, setLanguage, t } = useI18n();

  return (
    <div>
      <span data-testid="lang">{language}</span>
      <span data-testid="title">{t('app.name')}</span>
      <span data-testid="greeting">{t('dash.welcome')}</span>
      <span data-testid="param-test">{t('reading.timeAllowed')}</span>
      <button onClick={() => setLanguage('vi')}>Switch VI</button>
      <button onClick={() => setLanguage('en')}>Switch EN</button>
    </div>
  );
};

describe('i18n', () => {
  it('contains equivalent translation key parity between English and Vietnamese', () => {
    const enKeys = Object.keys(en);
    const viKeys = Object.keys(vi);

    expect(enKeys.length).toBeGreaterThan(30);
    expect(viKeys.length).toBeGreaterThan(30);
    expect(enKeys.sort()).toEqual(viKeys.sort());

    // Verify critical navigation and UI keys exist in both
    ['app.name', 'nav.dashboard', 'nav.reading', 'nav.listening', 'nav.writing', 'nav.speaking', 'nav.vocabulary'].forEach(k => {
      expect(en[k]).toBeDefined();
      expect(vi[k]).toBeDefined();
    });
  });

  it('switches languages dynamically via I18nProvider', async () => {
    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('title')).toHaveTextContent('IELTS Slayer');

    const viBtn = screen.getByText('Switch VI');
    await userEvent.click(viBtn);

    expect(screen.getByTestId('lang')).toHaveTextContent('vi');
    expect(screen.getByTestId('greeting')).toHaveTextContent('Chào mừng bạn quay lại với IELTS Slayer!');
  });

  it('provides safe fallback when useI18n is called outside provider', () => {
    const FallbackComponent = () => {
      const { t, language } = useI18n();
      return <div data-testid="fallback">{language}:{t('app.name')}</div>;
    };

    render(<FallbackComponent />);
    expect(screen.getByTestId('fallback')).toHaveTextContent('en:IELTS Slayer');
  });
});
