import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoPracticeView } from '../../src/components/video/VideoPracticeView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';

describe('VideoPracticeView', () => {
  beforeEach(async () => {
    await storageService.resetAll();
  });

  it('creates private transcript practice, gives feedback, and saves an AWL word to SRS', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <VideoPracticeView />
      </I18nProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Load demo transcript' }));
    await user.click(screen.getByRole('button', { name: 'Create gap-fill practice' }));

    expect(await screen.findByText('Question 1 of 3')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Your answer' }), 'significant');
    await user.click(screen.getByRole('button', { name: 'Check answer' }));

    expect(await screen.findByText('Correct — excellent listening focus.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add to SRS' }));
    expect(await screen.findByText('Added to your private vocabulary deck.')).toBeInTheDocument();

    expect(await storageService.getVideoSessions()).toHaveLength(1);
    expect(await storageService.getCustomVocabulary()).toEqual([
      expect.objectContaining({ word: 'significant', isAWL: true }),
    ]);
  });
});
