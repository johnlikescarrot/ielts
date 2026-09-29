import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShadowingLab } from '../../src/components/video/ShadowingLab';
import {
  clampChunkIndex,
  clampChunkSeconds,
  createShadowingChunks,
  DEFAULT_CHUNK_SECONDS,
  MAX_CHUNK_SECONDS,
  MIN_CHUNK_SECONDS,
  nextShadowingRate,
} from '../../src/video/shadowing';
import { TranscriptCue } from '../../src/video/videoLesson';
import { I18nProvider } from '../../src/i18n/i18nContext';

const CUES: TranscriptCue[] = [
  { id: 'cue-1', startSeconds: 0, text: 'Researchers analyse evidence carefully.' },
  { id: 'cue-2', startSeconds: 2, text: 'They share the findings with communities.' },
  { id: 'cue-3', startSeconds: 6, text: 'Public transport can reduce pollution.' },
  { id: 'cue-4', startSeconds: 11, text: 'Investment improves accessible services.' },
];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('shadowing engine', () => {
  it('clamps configuration values and wraps model paces', () => {
    expect(clampChunkSeconds(Number.NaN)).toBe(DEFAULT_CHUNK_SECONDS);
    expect(clampChunkSeconds(0)).toBe(MIN_CHUNK_SECONDS);
    expect(clampChunkSeconds(10.9)).toBe(10);
    expect(clampChunkSeconds(999)).toBe(MAX_CHUNK_SECONDS);
    expect(nextShadowingRate(1)).toBe(1.15);
    expect(nextShadowingRate(99)).toBe(0.7);
  });

  it('builds time-bounded caption turns and clamps the selected turn', () => {
    expect(createShadowingChunks([], 5)).toEqual([]);
    expect(createShadowingChunks(CUES)).toHaveLength(2);
    expect(createShadowingChunks(CUES, 5)).toEqual([
      {
        id: 'shadow-1',
        startSeconds: 0,
        endSeconds: 6,
        text: 'Researchers analyse evidence carefully. They share the findings with communities.',
        cueIds: ['cue-1', 'cue-2'],
      },
      {
        id: 'shadow-2',
        startSeconds: 6,
        endSeconds: 11,
        text: 'Public transport can reduce pollution.',
        cueIds: ['cue-3'],
      },
      {
        id: 'shadow-3',
        startSeconds: 11,
        endSeconds: 16,
        text: 'Investment improves accessible services.',
        cueIds: ['cue-4'],
      },
    ]);
    expect(clampChunkIndex(-2, 3)).toBe(0);
    expect(clampChunkIndex(1.9, 3)).toBe(1);
    expect(clampChunkIndex(99, 3)).toBe(2);
    expect(clampChunkIndex(3, 0)).toBe(0);
  });
});

describe('ShadowingLab', () => {
  it('provides local looping, recording, source navigation, keyboard commands, and a practice queue', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const speak = vi.spyOn(window.speechSynthesis, 'speak');
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <I18nProvider>
        <ShadowingLab
          cues={CUES}
          sourceUrl="https://youtu.be/dQw4w9WgXcQ"
          onContinue={onContinue}
        />
      </I18nProvider>,
    );

    expect(screen.getByRole('heading', { name: 'Hear it. Shadow it. Refine it.' })).toBeInTheDocument();
    expect(screen.getByText('Turn 1 of 2')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '3 seconds' }));
    expect(screen.getByText('Turn 1 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '3× model' }));
    await user.click(screen.getByRole('button', { name: 'Play model' }));
    expect(speak).toHaveBeenCalled();
    expect(speak.mock.calls[0][0]).toMatchObject({ rate: 1, text: `${CUES[0].text} ${CUES[1].text}` });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Play model' })).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: '0.7×' }));
    await user.click(screen.getByRole('button', { name: '1×' }));
    fireEvent.keyDown(window, { code: 'KeyR' });
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(screen.getByText('Turn 2 of 3')).toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    expect(screen.getByText('Turn 1 of 3')).toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'Space' });
    expect(speak.mock.calls.at(-1)?.[0]).toMatchObject({ rate: 1.15 });
    fireEvent.keyDown(window, { code: 'Space' });

    await user.click(screen.getByRole('button', { name: 'Open at timestamp' }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('&t=0s'), '_blank', 'noopener,noreferrer');

    await user.click(screen.getByRole('button', { name: 'Turn 2 at 0:06' }));
    expect(screen.getByText('Turn 2 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous turn' }));
    expect(screen.getByText('Turn 1 of 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next turn' }));
    expect(screen.getByText('Turn 2 of 3')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('button', { name: 'Next turn' }), { code: 'ArrowRight' });
    expect(screen.getByText('Turn 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start shadow recording' }));
    expect(await screen.findByRole('button', { name: 'Stop shadow recording' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop shadow recording' }));
    expect(await screen.findByText('1 private take(s) recorded in this session.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play my shadow recording' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Continue to vocabulary' }));
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('stays idle when speech playback is unavailable and recovers from a speech error', async () => {
    const user = userEvent.setup();
    const originalSpeechSynthesis = window.speechSynthesis;
    (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis = undefined;

    const { unmount } = render(
      <I18nProvider>
        <ShadowingLab cues={CUES} sourceUrl="not a URL" onContinue={() => {}} />
      </I18nProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Play model' }));
    expect(screen.getByRole('button', { name: 'Play model' })).toBeInTheDocument();
    (window as unknown as { speechSynthesis: SpeechSynthesis }).speechSynthesis = originalSpeechSynthesis;
    unmount();

    let lastUtterance: SpeechSynthesisUtterance | undefined;
    const speak = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(utterance => {
      lastUtterance = utterance;
    });
    render(
      <I18nProvider>
        <ShadowingLab cues={CUES} sourceUrl="not a URL" onContinue={() => {}} />
      </I18nProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Play model' }));
    act(() => {
      lastUtterance?.onerror?.(new Event('error') as SpeechSynthesisErrorEvent);
    });
    expect(screen.getByRole('button', { name: 'Play model' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play model' }));
    await user.click(screen.getByRole('button', { name: 'Stop model' }));
    act(() => {
      lastUtterance?.onerror?.(new Event('error') as SpeechSynthesisErrorEvent);
    });
    expect(speak).toHaveBeenCalledTimes(2);
  });

  it('does not render a broken studio for an empty cue list', () => {
    const { container } = render(
      <I18nProvider>
        <ShadowingLab cues={[]} sourceUrl="not a URL" onContinue={() => {}} />
      </I18nProvider>,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
