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
    await user.selectOptions(screen.getByLabelText('Shadowing chunk length'), '5');
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));

    expect(screen.getByRole('heading', { name: 'Private Shadowing Studio' })).toBeInTheDocument();
    expect(screen.getByText(/Transcript hidden/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reveal transcript' }));
    expect(screen.getByText(/Researchers analyze how cities/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play and repeat current chunk' }));
    expect(screen.getByText('Repeating…')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Repetitions: 3\/3/)).toBeInTheDocument());

    const speedControl = screen.getByLabelText('Speed');
    fireEvent.keyDown(speedControl, { key: 'ArrowRight' });
    await user.selectOptions(speedControl, '1');
    await user.selectOptions(screen.getByLabelText('Repetitions per chunk'), '1');
    await user.click(screen.getByLabelText('Auto-advance after repetitions'));

    await user.click(screen.getByRole('button', { name: 'Previous shadowing chunk' }));
    await user.click(screen.getByRole('button', { name: 'Next shadowing chunk' }));
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: ' ' });
    await waitFor(() => expect(screen.getByText(/Repetitions: 1\/1/)).toBeInTheDocument());

    const nextChunk = screen.getByRole('button', { name: 'Next shadowing chunk' });
    while (!nextChunk.hasAttribute('disabled')) await user.click(nextChunk);
    expect(nextChunk).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Open at timestamp' }));
    await user.click(screen.getByRole('button', { name: 'Continue to listening challenge' }));

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

  it('supports tab navigation and Vietnamese localization', async () => {
    await storageService.updateSettings({ language: 'vi' });
    const user = userEvent.setup();
    renderLab();

    expect(await screen.findByRole('heading', { name: /Biến mọi video/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dùng transcript mẫu' }));
    await user.click(screen.getByRole('button', { name: 'Tạo bài luyện nghe' }));
    expect(screen.getByRole('heading', { name: 'Phòng Shadowing riêng tư' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Bước 4 Từ vựng/i }));
    expect(screen.getByText(/Thiết kế học tập: phụ đề/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Bước 3 Luyện nghe/i }));
    expect(screen.getByRole('heading', { name: 'Thử thách nghe chủ động' })).toBeInTheDocument();
  });

  it('shows an empty vocabulary state for a non-academic transcript', async () => {
    const user = userEvent.setup();
    renderLab();
    const transcript = Array.from({ length: 5 }, (_, index) => `${index}:00 Wonderful storytelling celebrates friendship everywhere.`).join('\n');
    fireEvent.change(screen.getByLabelText('English transcript'), { target: { value: transcript } });
    await user.click(screen.getByRole('button', { name: 'Create listening lesson' }));
    await user.click(screen.getByRole('tab', { name: /Step 4 Vocabulary/i }));
    expect(screen.getByText(/No known academic terms were detected/)).toBeInTheDocument();
  });
});
