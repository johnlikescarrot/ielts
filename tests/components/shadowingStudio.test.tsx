import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShadowingStudioView } from '../../src/components/shadowing/ShadowingStudioView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';

const renderStudio = () =>
  render(
    <I18nProvider>
      <ShadowingStudioView />
    </I18nProvider>,
  );

const startPractice = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Try sample captions' }));
  await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
};

describe('ShadowingStudioView', () => {
  beforeEach(async () => {
    await storageService.resetAll();
  });

  it('runs the browser-voice shadowing workflow end to end', async () => {
    const user = userEvent.setup();
    const speak = vi.spyOn(window.speechSynthesis, 'speak');
    renderStudio();

    expect(screen.getByRole('heading', { name: /Shadow your way to a natural speaking voice/i })).toBeInTheDocument();

    // Validation: captions are required.
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 20 English words/i);

    // Typing clears the error live.
    await user.type(screen.getByLabelText('English transcript or captions'), 'hello world today');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Tabs stay locked until a session exists.
    expect(screen.getByRole('tab', { name: /Step 2/i })).toBeDisabled();

    // Sample captions replace the text and expose a word count.
    await user.click(screen.getByRole('button', { name: 'Try sample captions' }));
    expect(screen.getByText(/\d+ words/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));

    // Practice step with the browser-voice pronunciation model.
    expect(screen.getByText('Pronunciation model')).toBeInTheDocument();
    expect(screen.getByText('Chunk 1 of 4')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous chunk' })).toBeDisabled();

    // Replay speaks the chunk; the mocked utterance completes shortly after.
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    expect(speak).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText('1/4')).toBeInTheDocument());

    // Navigation.
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Chunk 2 of 4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Previous chunk' }));
    expect(screen.getByText('Chunk 1 of 4')).toBeInTheDocument();

    // Speed ladder.
    await user.click(screen.getByRole('button', { name: 'Playback speed' }));
    expect(screen.getByText('×1.25')).toBeInTheDocument();

    // Script hiding with per-chunk peeking.
    await user.click(screen.getByRole('button', { name: 'Hide script' }));
    expect(screen.getByText(/Script hidden/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Peek at script' }));
    expect(screen.getByText(/Good morning/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText(/Script hidden/i)).toBeInTheDocument();

    // Auto-advance chains through the remaining chunks.
    await user.click(screen.getByRole('button', { name: 'Auto-advance' }));
    expect(screen.getByRole('button', { name: 'Auto-advance' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    await waitFor(() => expect(screen.getByText('4/4')).toBeInTheDocument(), { timeout: 2000 });
    expect(screen.getByText('Chunk 4 of 4')).toBeInTheDocument();

    // Finish and review.
    await user.click(screen.getByRole('button', { name: 'Finish session' }));
    expect(screen.getByRole('heading', { name: 'Shadowing session review' })).toBeInTheDocument();
    expect(screen.getByText('Session saved to your local history.')).toBeInTheDocument();
    expect(screen.getByText('Every chunk was shadowed — well done!')).toBeInTheDocument();
    expect(screen.getAllByText('✓ shadowed')).toHaveLength(4);
    expect(screen.getByText('100%')).toBeInTheDocument();

    const history = await storageService.getTestHistory();
    expect(history[0]).toMatchObject({
      skill: 'shadowing',
      testId: 'shadowing-studio',
      rawScore: 4,
      totalQuestions: 4,
    });
    expect(history[0].speakingNotes).toContain('no band estimate');

    // Resume and reset.
    await user.click(screen.getByRole('button', { name: 'Keep practising' }));
    expect(screen.getByText('Chunk 4 of 4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'New source' }));
    expect(screen.getByRole('heading', { name: 'Build your shadowing workout' })).toBeInTheDocument();
    expect(screen.getByText(/\d+ words/i)).toBeInTheDocument();
  });

  it('drives chunked YouTube playback through privacy-enhanced embeds', async () => {
    const user = userEvent.setup();
    renderStudio();

    await user.click(screen.getByRole('button', { name: 'Try sample captions' }));
    await user.click(screen.getByLabelText('YouTube preview'));

    // A YouTube source needs a valid URL.
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid YouTube URL/i);

    await user.type(screen.getByLabelText('YouTube URL or video ID'), 'https://youtu.be/dQw4w9WgXcQ');
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));

    const frame = screen.getByTitle('YouTube chunk preview') as HTMLIFrameElement;
    expect(frame.src).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=0&rel=0&modestbranding=1&autoplay=1&end=12',
    );
    expect(screen.getByText(/Each replay re-opens the exact chunk window/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Auto-advance' })).toBeDisabled();

    // Walk forward chunk by chunk; each chunk played then advanced is marked shadowed.
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Chunk 2 of 4')).toBeInTheDocument();
    const secondFrame = screen.getByTitle('YouTube chunk preview') as HTMLIFrameElement;
    expect(secondFrame.src).toContain('start=12');
    expect(secondFrame.src).toContain('end=24');

    const sourceLink = screen.getByRole('link', { name: 'Open on YouTube' });
    expect(sourceLink).toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s');

    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Chunk 4 of 4')).toBeInTheDocument();
    const lastFrame = screen.getByTitle('YouTube chunk preview') as HTMLIFrameElement;
    expect(lastFrame.src).not.toContain('end=');

    // Replay re-embeds the same window.
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    expect(screen.getByTitle('YouTube chunk preview')).toBeInTheDocument();

    // Partial completion: finish and revisit the missing chunk.
    await user.click(screen.getByRole('button', { name: 'Finish session' }));
    expect(screen.getByText('Chunks to revisit')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Chunk 4 of 4/i }));
    expect(screen.getByText('Chunk 4 of 4')).toBeInTheDocument();

    const history = await storageService.getTestHistory();
    expect(history[0].rawScore).toBe(3);
    expect(history[0].totalQuestions).toBe(4);
  });

  it('shadows a local media file with boundary auto-stop and auto-advance', async () => {
    const user = userEvent.setup();
    renderStudio();

    await user.click(screen.getByRole('button', { name: 'Try sample captions' }));
    await user.click(screen.getByLabelText('Local audio or video'));

    // A local source needs a file.
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/choose an audio or video file/i);

    const dropZone = screen.getByText(/Drop an audio or video file here/i).closest('div') as HTMLElement;

    // Unsupported file types are rejected.
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [new File(['x'], 'notes.txt', { type: 'text/plain' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(/not supported/i);

    // Empty drops are ignored, and drags are allowed over the zone.
    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, { dataTransfer: { files: [] } });
    expect(screen.getByRole('alert')).toHaveTextContent(/not supported/i);

    // A dropped video file is accepted.
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [new File(['vid'], 'lecture.mp4', { type: 'video/mp4' })] },
    });
    expect(screen.getByText(/lecture.mp4/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(document.querySelector('video')).toBeTruthy();
    expect(screen.queryByText('Pronunciation model')).not.toBeInTheDocument();

    // A natural end also completes the chunk that is currently playing.
    const video = document.querySelector('video') as HTMLVideoElement;
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    expect(video.currentTime).toBe(0);
    fireEvent(video, new Event('ended'));
    await waitFor(() => expect(screen.getByText('1/4')).toBeInTheDocument());

    // Reset for the audio-file flow.
    await user.click(screen.getByRole('button', { name: 'New source' }));
    await user.click(screen.getByLabelText('Browser voice'));
    await user.click(screen.getByLabelText('Local audio or video'));

    const fileInput = screen.getByLabelText('Browse files');
    // A change event without a selection is ignored.
    fireEvent.change(fileInput);
    fireEvent.change(fileInput, { target: { files: [new File(['audio'], 'talk.mp3', { type: 'audio/mpeg' })] } });
    expect(screen.getByText(/talk.mp3/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    const audio = document.querySelector('audio') as HTMLAudioElement;
    expect(audio).toBeTruthy();

    // Unusable metadata is ignored; real metadata clamps the final chunk's range.
    fireEvent(audio, new Event('loadedmetadata'));
    await user.click(screen.getByRole('button', { name: 'Jump to chunk 4' }));
    expect(screen.getByText('0:36 – 0:46')).toBeInTheDocument();
    Object.defineProperty(audio, 'duration', { value: 40, configurable: true });
    fireEvent(audio, new Event('loadedmetadata'));
    expect(screen.getByText('0:36 – 0:40')).toBeInTheDocument();

    // Replay seeks to the chunk start.
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    expect(audio.currentTime).toBe(36);
    expect(audio.playbackRate).toBe(1);

    // Crossing the boundary completes the chunk and pauses playback.
    audio.currentTime = 40;
    fireEvent(audio, new Event('timeupdate'));
    await waitFor(() => expect(screen.getByText('1/4')).toBeInTheDocument());

    // Auto-advance chains into the next chunk at the boundary.
    await user.click(screen.getByRole('button', { name: 'Auto-advance' }));
    await user.click(screen.getByRole('button', { name: 'Jump to chunk 1' }));
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    audio.currentTime = 12;
    fireEvent(audio, new Event('timeupdate'));
    expect(screen.getByText('Chunk 2 of 4')).toBeInTheDocument();
    expect(audio.currentTime).toBe(12);

    // Speed changes reach the live element.
    await user.click(screen.getByRole('button', { name: 'Playback speed' }));
    expect(audio.playbackRate).toBe(1.25);
  });

  it('binds shortcuts only while practising and outside text fields', async () => {
    const speak = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => {});
    const user = userEvent.setup();
    renderStudio();

    // No shortcuts on the source step.
    fireEvent.keyDown(window, { code: 'Space' });
    expect(speak).not.toHaveBeenCalled();

    await startPractice(user);

    fireEvent.keyDown(window, { code: 'KeyR' });
    expect(screen.getByText('×1.25')).toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'Space' });
    expect(speak).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    expect(screen.getByText('Chunk 2 of 4')).toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    expect(screen.getByText('Chunk 1 of 4')).toBeInTheDocument();
    // Previous at the first chunk is a no-op.
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    expect(screen.getByText('Chunk 1 of 4')).toBeInTheDocument();
    fireEvent.keyDown(window, { code: 'KeyA' });
    expect(screen.getByRole('button', { name: 'Auto-advance' })).toHaveAttribute('aria-pressed', 'true');

    // Unmapped keys and modifier combos stay with the browser.
    fireEvent.keyDown(window, { code: 'KeyZ' });
    fireEvent.keyDown(window, { code: 'KeyR', ctrlKey: true });
    expect(screen.getByText('×1.25')).toBeInTheDocument();

    // Typing contexts keep their keys.
    const field = document.createElement('input');
    document.body.appendChild(field);
    fireEvent.keyDown(field, { code: 'KeyR' });
    expect(screen.getByText('×1.25')).toBeInTheDocument();
    field.remove();
  });

  it('tunes the chunk length and navigates steps from the tab strip', async () => {
    const user = userEvent.setup();
    renderStudio();

    const chunkInput = screen.getByLabelText('Chunk length (seconds)') as HTMLInputElement;
    expect(chunkInput).toHaveValue(10);

    // Empty and out-of-range input fall back to sane values.
    fireEvent.change(chunkInput, { target: { value: '' } });
    expect(chunkInput).toHaveValue(10);
    fireEvent.change(chunkInput, { target: { value: '500' } });
    fireEvent.blur(chunkInput);
    expect(chunkInput).toHaveValue(120);

    // A shorter target produces one-cue chunks.
    fireEvent.change(chunkInput, { target: { value: '5' } });
    await startPractice(user);
    expect(screen.getByText('Chunk 1 of 8')).toBeInTheDocument();

    // Advancing without listening marks nothing as shadowed.
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Chunk 2 of 8')).toBeInTheDocument();
    expect(screen.getByText('0/8')).toBeInTheDocument();

    // Jumping from the chunk strip keeps played-but-unfinished chunks visible.
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    await user.click(screen.getByRole('button', { name: 'Jump to chunk 4' }));
    expect(screen.getByText('Chunk 4 of 8')).toBeInTheDocument();

    // Next past the final chunk stays put and only marks visited chunks.
    await user.click(screen.getByRole('button', { name: 'Jump to chunk 8' }));
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Chunk 8 of 8')).toBeInTheDocument();

    // Tab strip navigation and a revisit jump from the review step.
    await user.click(screen.getByRole('tab', { name: /Step 3/i }));
    expect(screen.getByRole('heading', { name: 'Shadowing session review' })).toBeInTheDocument();
    expect(screen.getByText('Chunks to revisit')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Chunk 1 of 8/i }));
    expect(screen.getByText('Chunk 1 of 8')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Step 3/i }));
    await user.click(screen.getByRole('tab', { name: /Step 2/i }));
    expect(screen.getByText('Chunk 1 of 8')).toBeInTheDocument();
  });

  it('localises fully into Vietnamese', async () => {
    await storageService.updateSettings({ language: 'vi' });
    const user = userEvent.setup();
    renderStudio();

    expect(await screen.findByRole('heading', { name: /Luyện shadowing để có giọng nói tự nhiên/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dùng phụ đề mẫu' }));
    await user.click(screen.getByRole('button', { name: 'Bắt đầu shadowing' }));

    expect(screen.getByText('Đoạn 1/4')).toBeInTheDocument();
    expect(screen.getByText('Mẫu phát âm')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Kết thúc buổi luyện' }));
    expect(screen.getByRole('heading', { name: 'Tổng kết buổi shadowing' })).toBeInTheDocument();
    expect(screen.getByText('Buổi luyện đã được lưu vào lịch sử trên máy.')).toBeInTheDocument();
    expect(screen.getByText('Đoạn cần luyện lại')).toBeInTheDocument();
    expect(screen.getByText(/Thiết kế học tập: nghe – nhại lại/i)).toBeInTheDocument();
  });
});
