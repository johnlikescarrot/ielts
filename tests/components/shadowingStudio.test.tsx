import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoLabView } from '../../src/components/video/VideoLabView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';
import { parseTranscript } from '../../src/video/videoLesson';
import {
  buildShadowingChunks,
  createShadowingSession,
  rateChunk,
  selectActiveChunk,
  ShadowingSession,
  ShadowingSessionRecord,
} from '../../src/shadowing/shadowingEngine';

const SAMPLE_TRANSCRIPT = `[00:00] Researchers analyze how cities can create sustainable transport systems.
[00:08] The evidence indicates that accessible public transit benefits entire communities.
[00:16] However, governments must allocate significant resources before infrastructure can improve.
[00:24] One innovative approach is to integrate cycling routes with railway stations.
[00:32] This policy could mitigate pollution while encouraging healthier daily routines.
[00:40] Citizens increasingly support environmental measures when the economic benefits are clear.
[00:48] In conclusion, effective urban planning requires cooperation, investment, and careful assessment.`;

const renderLab = () => render(<I18nProvider><VideoLabView /></I18nProvider>);

const startStudio = async (url?: string) => {
  renderLab();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
  if (url) {
    await user.type(screen.getByLabelText(/YouTube URL/i), url);
  }
  await user.click(screen.getByRole('button', { name: 'Start shadowing studio' }));
  return user;
};

const seedSession = async (id: string, activeChunkId: string): Promise<ShadowingSessionRecord> => {
  const cues = parseTranscript(SAMPLE_TRANSCRIPT);
  let session: ShadowingSession = createShadowingSession(buildShadowingChunks(cues, 8), new Date('2026-09-29T10:00:00Z'));
  session = rateChunk(session, 'chunk-1', 2, new Date('2026-09-29T10:01:00Z'));
  session = selectActiveChunk(session, activeChunkId);
  const record: ShadowingSessionRecord = {
    id,
    session,
    sourceUrl: '',
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    completedAt: null,
  };
  await storageService.saveShadowingSession(record);
  return record;
};

describe('ShadowingStudioView (via the Video Lab)', () => {
  beforeEach(async () => {
    await storageService.resetAll();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts a studio session and drives playback with the keyboard', async () => {
    const user = await startStudio();
    expect(screen.getByRole('heading', { name: 'Shadowing Studio: speak along, chunk by chunk' })).toBeInTheDocument();
    expect(screen.getByText('Chunk 1 of 7')).toBeInTheDocument();
    expect(screen.getByText('7 chunks due for review')).toBeInTheDocument();
    // No source URL was provided, so there is nothing to open on YouTube.
    expect(screen.queryByRole('button', { name: 'Open at timestamp' })).toBeNull();
    expect(screen.getByText('Record yourself and compare')).toBeInTheDocument();

    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
    await user.click(screen.getByRole('button', { name: 'Play chunk' }));
    expect(speakSpy).toHaveBeenCalledTimes(1);
    expect(speakSpy.mock.calls[0][0].rate).toBe(1);
    expect(speakSpy.mock.calls[0][0].text).toContain('Researchers analyze');

    // R cycles the playback speed like the reference player.
    await user.keyboard('r');
    expect((screen.getByLabelText('Playback speed') as HTMLSelectElement).value).toBe('1.25');

    // The speed can also be picked directly from the ladder.
    await user.selectOptions(screen.getByLabelText('Playback speed'), '0.5');
    expect((screen.getByLabelText('Playback speed') as HTMLSelectElement).value).toBe('0.5');
    (screen.getByLabelText('Playback speed') as HTMLElement).blur();

    // Space replays the active chunk at the current speed.
    fireEvent.keyDown(document.body, { key: ' ' });
    expect(speakSpy).toHaveBeenCalledTimes(2);
    expect(speakSpy.mock.calls[1][0].rate).toBe(0.5);
    expect(speakSpy.mock.calls[1][0].text).toContain('Researchers analyze');

    // Unmapped keys are ignored and change nothing.
    fireEvent.keyDown(document.body, { key: 'x', ctrlKey: true });
    fireEvent.keyDown(document.body, { key: 'z' });
    expect(speakSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Chunk 1 of 7')).toBeInTheDocument();

    // Arrow keys move between chunks; the replay button then speaks the new chunk.
    await user.keyboard('[ArrowRight]');
    expect(screen.getByText('Chunk 2 of 7')).toBeInTheDocument();
    await user.keyboard('[ArrowLeft]');
    expect(screen.getByText('Chunk 1 of 7')).toBeInTheDocument();

    // The previous/next buttons move between chunks as well.
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Chunk 2 of 7')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous chunk' }));
    expect(screen.getByText('Chunk 1 of 7')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Replay current chunk' }));
    expect(speakSpy).toHaveBeenCalledTimes(3);
    expect(speakSpy.mock.calls[2][0].text).toContain('Researchers analyze');
  });

  it('records self-ratings, advances, and persists the session locally', async () => {
    const user = await startStudio();

    await user.click(screen.getByRole('button', { name: /^Good/ }));
    expect(screen.getByText('Chunk 2 of 7')).toBeInTheDocument();
    expect(screen.getByText('1/7 mastered')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Again/ }));
    expect(screen.getByText('Chunk 3 of 7')).toBeInTheDocument();

    // Without auto-advance the learner stays on the chunk they just rated.
    await user.click(screen.getByRole('button', { name: /Auto-advance after rating: On/ }));
    expect(screen.getByRole('button', { name: /Auto-advance after rating: Off/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Hard/ }));
    expect(screen.getByText('Chunk 3 of 7')).toBeInTheDocument();

    await waitFor(async () => {
      expect(await storageService.getShadowingSessions()).toHaveLength(1);
    });
    const sessions = await storageService.getShadowingSessions();
    expect(sessions[0].completedAt).toBeNull();
    expect(sessions[0].session.progress['chunk-1'].lastRating).toBe(2);
    expect(sessions[0].session.progress['chunk-2'].lastRating).toBe(0);
    expect(sessions[0].session.progress['chunk-3'].lastRating).toBe(1);
    expect(sessions[0].sourceUrl).toBe('');
  });

  it('jumps between chunks from the chunk rail', async () => {
    const user = await startStudio();
    expect(screen.getAllByRole('button', { name: /Go to chunk/ })).toHaveLength(7);

    await user.click(screen.getByRole('button', { name: /Go to chunk 4/ }));
    expect(screen.getByText('Chunk 4 of 7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Go to chunk 4/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /Go to chunk 1/ })).not.toHaveAttribute('aria-current');
  });

  it('hides the transcript and changes the chunk length', async () => {
    const user = await startStudio();
    expect(screen.getByText(/Researchers analyze how cities/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Hide transcript/ }));
    expect(screen.queryByText(/Researchers analyze/)).toBeNull();
    expect(screen.getByText(/Transcript hidden — listen and shadow/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show transcript/ }));
    expect(screen.getByText(/Researchers analyze/)).toBeInTheDocument();

    // A longer chunk target regroups the 7 cues into 4 chunks.
    await user.selectOptions(screen.getByLabelText('Chunk length (restarts session)'), '15');
    expect(screen.getByText('Chunk 1 of 4')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Go to chunk/ })).toHaveLength(4);
  });

  it('opens the source video at the active chunk timestamp', async () => {
    const user = await startStudio('https://youtu.be/dQw4w9WgXcQ');

    await user.click(screen.getByRole('button', { name: 'Open at timestamp' }));
    expect(window.open).toHaveBeenCalledWith(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=0s',
      '_blank',
      'noopener,noreferrer',
    );

    await user.click(screen.getByRole('button', { name: /^Good/ }));
    await user.click(screen.getByRole('button', { name: 'Open at timestamp' }));
    expect(window.open).toHaveBeenLastCalledWith(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=8s',
      '_blank',
      'noopener,noreferrer',
    );
  });

  it('shows a summary when every chunk has been practised', async () => {
    const user = await startStudio();
    for (let index = 0; index < 7; index += 1) {
      await user.click(screen.getByRole('button', { name: /^Good/ }));
    }

    const summary = screen.getByRole('status', { name: 'Session complete — well shadowed!' });
    expect(within(summary).getByText('7/7')).toBeInTheDocument();
    expect(within(summary).getByText('2.0 / 3')).toBeInTheDocument();

    await waitFor(async () => {
      const sessions = await storageService.getShadowingSessions();
      expect(sessions[0].completedAt).not.toBeNull();
    });

    await user.click(screen.getByRole('button', { name: 'Keep practising' }));
    expect(screen.queryByRole('status', { name: 'Session complete — well shadowed!' })).toBeNull();

    await user.click(screen.getAllByRole('button', { name: 'New session' })[0]);
    expect(screen.getByRole('heading', { name: 'Create your private video lesson' })).toBeInTheDocument();
  });

  it('offers to resume a saved session', async () => {
    await seedSession('shadow-resume', 'chunk-3');
    const user = await startStudio();

    expect(await screen.findByRole('heading', { name: 'Resume a previous session' })).toBeInTheDocument();
    expect(screen.getByText(/1 of 7 chunks practised/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Resume session' }));
    expect(screen.getByText('Chunk 3 of 7')).toBeInTheDocument();
    expect(screen.getByText('1/7 mastered')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resume a previous session' })).toBeNull();
  });

  it('discards a saved session from the resume banner', async () => {
    await seedSession('shadow-discard', 'chunk-2');
    const user = await startStudio();

    await screen.findByRole('heading', { name: 'Resume a previous session' });
    await user.click(screen.getByRole('button', { name: 'Discard' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Resume a previous session' })).toBeNull(),
    );
    expect(await storageService.getShadowingSessions()).toHaveLength(0);
  });

  it('ignores corrupted saved sessions', async () => {
    await storageService.saveShadowingSession({
      id: 'broken',
      session: { chunks: [] } as unknown as ShadowingSession,
      sourceUrl: '',
      createdAt: 'not-a-date',
      updatedAt: 'not-a-date',
      completedAt: null,
    });
    await startStudio();

    expect(await screen.findByRole('heading', { name: 'Shadowing Studio: speak along, chunk by chunk' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Resume a previous session' })).toBeNull(),
    );
  });

  it('cancels speech and ignores late storage loads when unmounted', async () => {
    let resolveLoad: (records: ShadowingSessionRecord[]) => void = () => {};
    const loadSpy = vi.spyOn(storageService, 'getShadowingSessions').mockImplementation(
      () => new Promise<ShadowingSessionRecord[]>(resolve => {
        resolveLoad = resolve;
      }),
    );
    const cancelSpy = vi.spyOn(window.speechSynthesis, 'cancel').mockImplementation(() => {});

    const { unmount } = renderLab();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.click(screen.getByRole('button', { name: 'Start shadowing studio' }));

    unmount();
    await act(async () => {
      resolveLoad([]);
    });

    expect(cancelSpy).toHaveBeenCalled();
    loadSpy.mockRestore();
  });

  it('renders the studio in Vietnamese', async () => {
    await storageService.updateSettings({ language: 'vi' });
    const user = userEvent.setup();
    renderLab();

    await user.click(await screen.findByRole('button', { name: 'Dùng transcript mẫu' }));
    await user.click(screen.getByRole('button', { name: 'Bắt đầu phòng luyện Shadowing' }));

    expect(await screen.findByRole('heading', { name: 'Phòng luyện Shadowing: nói bám theo từng đoạn' })).toBeInTheDocument();
    expect(screen.getByText('Đoạn 1 / 7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Tốt/ })).toBeInTheDocument();
    expect(screen.getByText(/7 đoạn cần ôn tập/)).toBeInTheDocument();
    expect(screen.getByText(/Thiết kế học tập: shadowing theo đoạn/)).toBeInTheDocument();
  });
});
