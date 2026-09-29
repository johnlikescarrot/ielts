import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoLabView } from '../../src/components/video/VideoLabView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';

const renderLab = () => render(<I18nProvider><VideoLabView /></I18nProvider>);

describe('VideoLabView', () => {
  beforeEach(async () => {
    await storageService.resetAll();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('validates input and completes the listening and vocabulary workflow', async () => {
    const user = userEvent.setup();
    renderLab();

    expect(screen.getByRole('heading', { name: /Turn any captioned video/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 20 English words/i);

    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.type(screen.getByLabelText(/YouTube URL/i), 'https://youtu.be/dQw4w9WgXcQ');
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));

    expect(screen.getByRole('heading', { name: 'Active listening challenge' })).toBeInTheDocument();
    const answerInputs = screen.getAllByLabelText(/Answer for question/i);
    await user.type(answerInputs[0], 'analyze');
    const firstHint = screen.getAllByRole('button', { name: 'Show spelling hint' })[0];
    await user.click(firstHint);
    expect(screen.getByText(/letters/)).toBeInTheDocument();
    await user.click(firstHint);

    await user.click(screen.getByRole('button', { name: /Play listening cue 1/i }));
    await user.click(screen.getAllByRole('button', { name: 'Open at timestamp' })[0]);
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('&t=0s'), '_blank', 'noopener,noreferrer');

    await user.click(screen.getByRole('button', { name: 'Check answers' }));
    expect(screen.getAllByText(/Answer:/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: 'Practice again' }));
    await user.click(screen.getByRole('button', { name: 'Start shadowing studio' }));
    expect(screen.getByRole('heading', { name: 'Hear it. Shadow it. Refine it.' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue to vocabulary' }));
    expect(screen.getByRole('heading', { name: 'Academic vocabulary from this video' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to practice' }));

    await user.click(screen.getByRole('button', { name: 'Review vocabulary' }));
    expect(screen.getByRole('heading', { name: 'Academic vocabulary from this video' })).toBeInTheDocument();
    expect(screen.getByText('Phân tích chi tiết')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to practice' }));
    await user.click(screen.getByRole('button', { name: 'New lesson' }));
    expect(screen.getByRole('heading', { name: 'Create your private video lesson' })).toBeInTheDocument();
  });

  it('uses local subtitles and original media for private cue replay', async () => {
    const user = userEvent.setup();
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:local-lesson');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const { unmount } = renderLab();

    const transcript = new File(['captions'], 'lesson.vtt', { type: 'text/vtt' });
    Object.defineProperty(transcript, 'text', {
      configurable: true,
      value: async () => `[00:00] Researchers analyze sustainable transport systems for growing communities.\n[00:08] Evidence indicates accessible public transit creates significant environmental benefits.\n[00:16] Governments allocate resources and integrate innovative infrastructure with careful assessment.`,
    });
    const audio = new File(['audio'], 'lesson.mp3', { type: 'audio/mpeg' });
    const [subtitleInput, mediaInput] = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));
    await user.upload(subtitleInput, transcript);
    await user.upload(mediaInput, audio);
    expect(await screen.findByText(/Loaded locally: lesson.vtt/)).toBeInTheDocument();
    expect(createObjectURL).toHaveBeenCalledWith(audio);

    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));
    const player = await screen.findByLabelText<HTMLAudioElement>('Local audio player');
    Object.defineProperty(player, 'duration', { configurable: true, value: 24 });
    await user.click(screen.getByRole('radio', { name: '0.75×' }));
    await user.click(screen.getAllByRole('button', { name: /Play listening cue/i })[0]);
    await waitFor(() => expect(play).toHaveBeenCalled());
    expect(player.currentTime).toBe(0);
    expect(player.playbackRate).toBe(0.75);

    player.currentTime = 7;
    fireEvent.timeUpdate(player);
    expect(pause).toHaveBeenCalledTimes(1);
    player.currentTime = 8;
    fireEvent.timeUpdate(player);
    expect(pause).toHaveBeenCalledTimes(2);

    await user.click(screen.getByRole('button', { name: 'Start shadowing studio' }));
    const shadowPlayer = await screen.findByLabelText<HTMLAudioElement>('Local audio player');
    await user.click(screen.getByRole('button', { name: 'Play original cue' }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    expect(shadowPlayer.currentTime).toBe(0);
    expect(pause).toHaveBeenCalledTimes(3);

    unmount();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-lesson');
  });

  it('supports tab navigation and Vietnamese localization', async () => {
    await storageService.updateSettings({ language: 'vi' });
    const user = userEvent.setup();
    renderLab();

    expect(await screen.findByRole('heading', { name: /Biến mọi video/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dùng transcript mẫu' }));
    await user.click(screen.getByRole('button', { name: 'Tạo bài luyện nghe' }));
    await user.click(screen.getByRole('tab', { name: /Bước 4 Từ vựng/i }));
    expect(screen.getByText(/Thiết kế học tập: phụ đề/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Bước 2 Luyện nghe/i }));
    expect(screen.getByRole('heading', { name: 'Thử thách nghe chủ động' })).toBeInTheDocument();
  });

  it('shows an empty vocabulary state for a non-academic transcript', async () => {
    const user = userEvent.setup();
    renderLab();
    const transcript = Array.from({ length: 5 }, (_, index) => `${index}:00 Wonderful storytelling celebrates friendship everywhere.`).join('\n');
    await user.type(screen.getByLabelText('English transcript'), transcript);
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));
    await user.click(screen.getByRole('button', { name: 'Review vocabulary' }));
    expect(screen.getByText(/No known academic terms were detected/)).toBeInTheDocument();
  });
});
