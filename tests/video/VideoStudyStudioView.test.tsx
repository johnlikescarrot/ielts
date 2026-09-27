import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VideoStudyStudioView } from '../../src/components/video/VideoStudyStudioView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';

const transcript = `[00:12] Governments must analyze reliable evidence and mitigate congestion through efficient public transport networks.
[00:24] Furthermore, integrated infrastructure can improve access for remote communities.
[01:02] Consequently, policymakers should assess the long-term benefit of this approach.`;

function renderStudio() {
  return render(
    <Theme theme={neutralTheme} mode="light">
      <I18nProvider>
        <VideoStudyStudioView />
      </I18nProvider>
    </Theme>,
  );
}

describe('VideoStudyStudioView', () => {
  beforeEach(async () => {
    await storageService.resetAll();
    vi.stubGlobal('confirm', vi.fn(() => true));
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('keeps the empty state private and validates inputs before saving', async () => {
    renderStudio();
    expect(await screen.findByText('No video lessons yet')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Build local lesson' }));
    expect(screen.getByText('Use a valid YouTube or Bilibili video URL.')).toBeInTheDocument();
  });

  it('creates a local lesson, reveals answers, deep-links timestamps, and deletes it', async () => {
    renderStudio();
    await screen.findByText('No video lessons yet');

    await userEvent.type(screen.getByRole('textbox', { name: /Lesson title/i }), 'Cities lecture');
    await userEvent.type(screen.getByRole('textbox', { name: /YouTube or Bilibili URL/i }), 'https://youtu.be/dQw4w9WgXcQ');
    fireEvent.change(screen.getByRole('textbox', { name: /Captions or transcript/i }), { target: { value: transcript } });
    await userEvent.click(screen.getByRole('button', { name: 'Build local lesson' }));

    expect((await screen.findAllByText('Cities lecture')).length).toBeGreaterThan(1);
    expect(screen.getByText('Lesson saved locally in Firefox.')).toBeInTheDocument();
    expect(screen.getByText('Listening cloze practice')).toBeInTheDocument();
    expect(screen.getByText('Academic vocabulary in context')).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: 'Reveal answer' })[0]);
    expect(screen.getByText(/Answer:/)).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole('button', { name: '0:12' })[0]);
    await userEvent.click(screen.getAllByRole('button', { name: '0:12' })[1]);
    expect(window.open).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s', '_blank', 'noopener,noreferrer');

    await userEvent.click(screen.getByRole('button', { name: 'Delete lesson' }));
    await waitFor(() => expect(screen.getByText('No video lessons yet')).toBeInTheDocument());
    expect(screen.getByText('Local lesson deleted.')).toBeInTheDocument();
  });
});
