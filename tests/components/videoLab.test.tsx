import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShadowingStudio } from '../../src/components/video/ShadowingStudio';
import { VideoLabView } from '../../src/components/video/VideoLabView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';
import { TranscriptCue } from '../../src/video/videoLesson';

const renderLab = () => render(<I18nProvider><VideoLabView /></I18nProvider>);
const renderStudio = (cues: TranscriptCue[], onContinue = vi.fn(), onOpenAt?: (seconds: number) => void) => render(
  <I18nProvider>
    <ShadowingStudio cues={cues} onContinue={onContinue} onOpenAt={onOpenAt} />
  </I18nProvider>,
);

const SHADOWING_CUES: TranscriptCue[] = [
  { id: 'cue-1', startSeconds: 0, text: 'First shadowing sentence.' },
  { id: 'cue-2', startSeconds: 6, text: 'Second shadowing sentence.' },
  { id: 'cue-3', startSeconds: 12, text: 'Third shadowing sentence.' },
];

describe('VideoLabView', () => {
  beforeEach(async () => {
    await storageService.resetAll();
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates input and completes the shadowing, listening, and vocabulary workflow', async () => {
    const user = userEvent.setup();
    renderLab();

    expect(screen.getByRole('heading', { name: /Turn any captioned video/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 20 English words/i);

    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.type(screen.getByLabelText(/YouTube URL/i), 'https://youtu.be/dQw4w9WgXcQ');
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));

    expect(screen.getByRole('heading', { name: 'Shadowing studio' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue to listening cloze' }));
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

    await user.click(screen.getByRole('button', { name: 'Review vocabulary' }));
    expect(screen.getByRole('heading', { name: 'Academic vocabulary from this video' })).toBeInTheDocument();
    expect(screen.getByText('Phân tích chi tiết')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to practice' }));
    await user.click(screen.getByRole('button', { name: 'New lesson' }));
    expect(screen.getByRole('heading', { name: 'Create your private video lesson' })).toBeInTheDocument();
  });

  it('supports the four-step workflow and Vietnamese localization', async () => {
    await storageService.updateSettings({ language: 'vi' });
    const user = userEvent.setup();
    renderLab();

    expect(await screen.findByRole('heading', { name: /Biến mọi video/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dùng transcript mẫu' }));
    await user.click(screen.getByRole('button', { name: 'Tạo bài luyện nghe' }));
    expect(screen.getByRole('heading', { name: 'Phòng luyện Shadowing theo đoạn' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Bước 4 Từ vựng/i }));
    expect(screen.getByText(/Thiết kế học tập: phụ đề/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Bước 3 Luyện nghe/i }));
    expect(screen.getByRole('heading', { name: 'Thử thách nghe chủ động' })).toBeInTheDocument();
  });

  it('shows an empty vocabulary state for a non-academic transcript', async () => {
    const user = userEvent.setup();
    renderLab();
    const transcript = Array.from({ length: 5 }, (_, index) => `${index}:00 Wonderful storytelling celebrates friendship everywhere.`).join('\n');
    await user.type(screen.getByLabelText('English transcript'), transcript);
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));
    await user.click(screen.getByRole('tab', { name: /Step 4 Vocabulary/i }));
    expect(screen.getByText(/No known academic terms were detected/)).toBeInTheDocument();
  });

  it('runs the accessible shadowing player with controls, shortcuts, and self-checks', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    const onOpenAt = vi.fn();
    let lastUtterance: SpeechSynthesisUtterance | null = null;
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(utterance => {
      lastUtterance = utterance;
    });
    const cancelSpy = vi.spyOn(window.speechSynthesis, 'cancel');

    const { rerender, unmount } = renderStudio(SHADOWING_CUES, onContinue);
    expect(screen.getByText('First shadowing sentence. Second shadowing sentence.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open at timestamp' })).not.toBeInTheDocument();

    rerender(
      <I18nProvider>
        <ShadowingStudio cues={SHADOWING_CUES} onContinue={onContinue} onOpenAt={onOpenAt} />
      </I18nProvider>,
    );
    await user.click(screen.getByRole('button', { name: 'Show captions' }));
    expect(screen.getByText(/Captions are hidden/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show captions' }));

    await user.click(screen.getByRole('radio', { name: '5 seconds' }));
    expect(screen.getByText('First shadowing sentence.')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '0.5×' }));
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    expect(speakSpy).toHaveBeenCalledTimes(1);
    expect(speakSpy.mock.calls[0][0].rate).toBe(0.5);
    expect(screen.getByRole('button', { name: 'Stop playback' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Stop playback' }));

    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Second shadowing sentence.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous chunk' }));
    expect(screen.getByText('First shadowing sentence.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Auto-advance' }));
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    await act(async () => {
      lastUtterance?.onend?.(new Event('end') as SpeechSynthesisEvent);
    });
    expect(screen.getByText('First shadowing sentence.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Auto-advance' }));
    await user.keyboard('r');
    expect(screen.getByRole('radio', { name: '0.75×' })).toHaveAttribute('aria-checked', 'true');
    await user.keyboard(' ');
    await act(async () => {
      lastUtterance?.onend?.(new Event('end') as SpeechSynthesisEvent);
    });
    expect(screen.getByText('Second shadowing sentence.')).toBeInTheDocument();

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByText('First shadowing sentence.')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Second shadowing sentence.')).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByText('Third shadowing sentence.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open at timestamp' }));
    expect(onOpenAt).toHaveBeenCalledWith(10);
    expect(screen.getByRole('button', { name: 'Next chunk' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Ready for cloze' }));
    await user.click(screen.getByRole('button', { name: 'Continue to listening cloze' }));
    expect(onContinue).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    await act(async () => {
      lastUtterance?.onerror?.(new Event('error') as SpeechSynthesisErrorEvent);
    });
    expect(screen.getByRole('button', { name: 'Replay chunk' })).toBeInTheDocument();
    unmount();
    expect(cancelSpy).toHaveBeenCalled();
  });

  it('keeps the listening route available when a shadowing studio has no cues', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    renderStudio([], onContinue);

    expect(screen.getByText(/no usable caption chunks/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue to listening cloze' }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
