import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('validates input and completes the shadowing, listening, and vocabulary workflow', async () => {
    const user = userEvent.setup();
    renderLab();

    expect(screen.getByRole('heading', { name: /Turn any captioned video/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 20 English words/i);

    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.type(screen.getByLabelText(/YouTube URL/i), 'https://youtu.be/dQw4w9WgXcQ');
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));

    expect(screen.getByRole('heading', { name: 'Private shadowing coach' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Shadowing progress' })).toHaveAttribute('aria-valuetext', '0/4');
    await user.selectOptions(screen.getByLabelText('Speech speed'), '1.15');
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    await user.click(screen.getByRole('button', { name: 'Open at timestamp' }));
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('&t=0s'), '_blank', 'noopener,noreferrer');

    await user.click(screen.getByRole('button', { name: 'Mark shadowed' }));
    expect(screen.getByLabelText('Shadowed')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Chunk 2' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('Auto-advance'));
    await user.click(screen.getByRole('button', { name: 'Mark shadowed' }));
    expect(screen.getByRole('heading', { name: 'Chunk 2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Chunk 3' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(screen.getByRole('heading', { name: 'Chunk 2' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Chunk 4/i }));
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    await user.selectOptions(screen.getByLabelText('Chunk length'), '20');
    expect(screen.getByRole('heading', { name: 'Chunk 1' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('Auto-advance'));
    await user.click(screen.getByRole('button', { name: 'Mark shadowed' }));
    await user.click(screen.getByRole('button', { name: 'Mark shadowed' }));
    await user.click(screen.getByRole('button', { name: 'Mark shadowed' }));
    expect(screen.getByText(/All chunks shadowed/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start listening challenge' }));

    expect(screen.getByRole('heading', { name: 'Active listening challenge' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to shadowing' }));
    expect(screen.getByRole('heading', { name: 'Private shadowing coach' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start listening challenge' }));

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
    await user.click(screen.getByRole('button', { name: 'Back to shadowing' }));
    expect(screen.getByRole('heading', { name: 'Private shadowing coach' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Step 4 Vocabulary/i }));
    await user.click(screen.getByRole('button', { name: 'Back to practice' }));
    expect(screen.getByRole('heading', { name: 'Active listening challenge' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New lesson' }));
    expect(screen.getByRole('heading', { name: 'Create your private video lesson' })).toBeInTheDocument();
  });

  it('supports tab navigation, hotkeys, and Vietnamese localization', async () => {
    await storageService.updateSettings({ language: 'vi' });
    const user = userEvent.setup();
    renderLab();

    expect(await screen.findByRole('heading', { name: /Biến mọi video/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dùng transcript mẫu' }));
    await user.click(screen.getByRole('button', { name: 'Tạo bài luyện nghe' }));
    expect(screen.getByRole('heading', { name: 'Huấn luyện shadowing riêng tư' })).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('heading', { name: 'Đoạn 2' })).toBeInTheDocument();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('heading', { name: 'Đoạn 1' })).toBeInTheDocument();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Đoạn 2' })).toBeInTheDocument();
    await user.keyboard(' ');

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
    await user.click(screen.getByRole('button', { name: 'Review vocabulary' }));
    expect(screen.getByText(/No known academic terms were detected/)).toBeInTheDocument();
  });
});
