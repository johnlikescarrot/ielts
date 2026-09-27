import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { ResearchCredibilityPanel } from '../../src/components/research/ResearchCredibilityPanel';

const renderPanel = (onSelectSkill = vi.fn()) => {
  render(
    <Theme theme={neutralTheme} mode="light">
      <I18nProvider>
        <ResearchCredibilityPanel targetBand={8} onSelectSkill={onSelectSkill} />
      </I18nProvider>
    </Theme>
  );
  return onSelectSkill;
};

describe('ResearchCredibilityPanel', () => {
  it('renders Astryx-powered Scholar evidence and navigation actions', async () => {
    const onSelectSkill = renderPanel();

    expect(screen.getByTestId('research-credibility-panel')).toBeInTheDocument();
    expect(screen.getByText('Astryx UI')).toBeInTheDocument();
    expect(screen.getByText('Google Scholar Kit')).toBeInTheDocument();
    expect(screen.getByText(/Scholar-ready practice design/i)).toBeInTheDocument();
    expect(screen.getByText('1998-2009')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Analyze a writing sample/i }));
    await userEvent.click(screen.getByRole('button', { name: /Review vocabulary SRS/i }));

    expect(onSelectSkill).toHaveBeenNthCalledWith(1, 'writing');
    expect(onSelectSkill).toHaveBeenNthCalledWith(2, 'vocabulary');

    const scholarLinks = screen.getAllByRole('link').filter(link =>
      link.getAttribute('href')?.startsWith('https://scholar.google.com/scholar?q=')
    );
    expect(scholarLinks.length).toBe(3);

    const downloadLink = screen.getByRole('link', { name: /Download Scholar kit/i });
    expect(downloadLink).toHaveAttribute('download', 'ielts-slayer-scholar-kit.md');
    expect(downloadLink.getAttribute('href')).toContain('data:text/markdown');
  });
});
