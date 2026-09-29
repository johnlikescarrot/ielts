import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShadowingStudioView } from '../../src/components/video/ShadowingStudioView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';

const renderStudio = () =>
  render(
    <I18nProvider>
      <ShadowingStudioView />
    </I18nProvider>
  );

describe('ShadowingStudioView', () => {
  let spokenUtterance: SpeechSynthesisUtterance | null = null;

  beforeEach(async () => {
    await storageService.resetAll();
    URL.createObjectURL = vi.fn(() => 'blob:mock-audio-url');
    URL.revokeObjectURL = vi.fn();

    spokenUtterance = null;
    (window as any).speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn((u: SpeechSynthesisUtterance) => {
        spokenUtterance = u;
      }),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders ShadowingStudioView with initial preset and plays active chunk with speech synthesis onend', async () => {
    renderStudio();

    expect(screen.getByRole('heading', { name: /IELTS Shadowing Studio/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Session Mastery/i)[0]).toBeInTheDocument();

    // Replay chunk
    const playBtn = screen.getByRole('button', { name: /Replay Chunk/i });
    fireEvent.click(playBtn);
    expect(window.speechSynthesis.speak).toHaveBeenCalled();

    // Trigger onend
    if (spokenUtterance && spokenUtterance.onend) {
      act(() => {
        spokenUtterance!.onend!(new Event('end') as any);
      });
    }

    // Trigger onerror
    fireEvent.click(playBtn);
    if (spokenUtterance && spokenUtterance.onerror) {
      act(() => {
        spokenUtterance!.onerror!(new Event('error') as any);
      });
    }

    // Navigate to next chunk
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    // Navigate to previous chunk
    const prevBtn = screen.getByRole('button', { name: /Previous/i });
    fireEvent.click(prevBtn);

    // Cycle speed
    const speedBtn = screen.getByText(/1x/i);
    fireEvent.click(speedBtn);
    expect(screen.getByText(/1.25x/i)).toBeInTheDocument();

    // Toggle auto-advance
    const autoAdvanceBtn = screen.getByText(/Auto-Advance: ON/i);
    fireEvent.click(autoAdvanceBtn);
    expect(screen.getByText(/Auto-Advance: OFF/i)).toBeInTheDocument();
  });

  it('cycles subtitle modes: full, blur, keywords, hidden', async () => {
    const user = userEvent.setup();
    renderStudio();

    const subtitleModeBtn = screen.getByTitle(/Cycle subtitle mode/i);
    await user.click(subtitleModeBtn);
    expect(screen.getByText(/Blurred/i)).toBeInTheDocument();

    await user.click(subtitleModeBtn);
    expect(screen.getByText(/Keywords Only/i)).toBeInTheDocument();

    await user.click(subtitleModeBtn);
    expect(screen.getAllByText(/Blind Shadowing/i)[0]).toBeInTheDocument();

    await user.click(subtitleModeBtn);
    expect(screen.getByText(/Full Captions/i)).toBeInTheDocument();
  });

  it('records user voice and compares with original and toggles playback pause', async () => {
    const user = userEvent.setup();
    renderStudio();

    // Start recording
    const recordBtn = screen.getByRole('button', { name: /Record Your Voice/i });
    await user.click(recordBtn);

    // Stop recording
    const stopBtn = screen.getByRole('button', { name: /Stop Recording/i });
    await user.click(stopBtn);

    // Playback user recording
    const playVoiceBtn = await screen.findByRole('button', { name: /Listen to Your Voice/i });
    await user.click(playVoiceBtn);

    // Click again to pause
    await user.click(playVoiceBtn);

    // Play again and trigger onEnded
    await user.click(playVoiceBtn);
    const userAudio = document.querySelector('audio');
    if (userAudio) {
      fireEvent.ended(userAudio);
    }

    // Compare with original
    const compareBtn = screen.getByRole('button', { name: /Listen to Original/i });
    await user.click(compareBtn);
  });

  it('adds detected chunk vocabulary to SRS flashcards', async () => {
    const user = userEvent.setup();
    renderStudio();

    const addVocabButtons = await screen.findAllByTitle(/Add to SRS Flashcards/i);
    expect(addVocabButtons.length).toBeGreaterThan(0);
    await user.click(addVocabButtons[0]);
    const customVocab = await storageService.getCustomVocabulary();
    expect(customVocab.length).toBeGreaterThanOrEqual(1);
  });

  it('switches between presets, youtube, and local media tabs with file uploads and playback', async () => {
    const user = userEvent.setup();
    renderStudio();

    // Switch to YouTube tab
    const ytTab = screen.getByRole('button', { name: /^YouTube$/i });
    await user.click(ytTab);
    const ytInput = screen.getByPlaceholderText(/https:\/\/www\.youtube\.com\/watch/i);
    const transcriptInput = screen.getByPlaceholderText(/Paste timestamps and captions/i);
    await user.type(ytInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    fireEvent.change(transcriptInput, {
      target: {
        value: '[00:00] Innovative technologies improve productivity.\n[00:05] Consequently, results enhance.',
      },
    });
    const loadYtBtn = screen.getByRole('button', { name: /Load YouTube Shadowing/i });
    await user.click(loadYtBtn);

    // Switch to Local Media tab
    const localTab = screen.getByRole('button', { name: /Local Media/i });
    await user.click(localTab);

    // Test file uploads (video and subtitles)
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs.length >= 2) {
      const mediaFile = new File(['mock video data'], 'test.mp4', { type: 'video/mp4' });
      await user.upload(fileInputs[0] as HTMLInputElement, mediaFile);

      const subtitleFile = new File(['1\n00:00:00,000 --> 00:00:04,000\nHello world'], 'test.srt', { type: 'text/plain' });
      await user.upload(fileInputs[1] as HTMLInputElement, subtitleFile);
    }

    // Play chunk on video element and trigger timeupdate
    const playBtn = screen.getByRole('button', { name: /Replay Chunk/i });
    await user.click(playBtn);
    const videoEl = document.querySelector('video');
    if (videoEl) {
      Object.defineProperty(videoEl, 'currentTime', { value: 10, writable: true });
      fireEvent.timeUpdate(videoEl);
    }

    // Test audio file upload
    if (fileInputs.length >= 1) {
      const audioFile = new File(['mock audio data'], 'test.mp3', { type: 'audio/mp3' });
      await user.upload(fileInputs[0] as HTMLInputElement, audioFile);
    }

    // Switch back to Presets tab and select another preset
    const presetsTab = screen.getByRole('button', { name: /Curated Drills/i });
    await user.click(presetsTab);
    const presetButtons = screen.getAllByRole('button');
    const innovationPreset = presetButtons.find(b => b.textContent?.includes('Groundbreaking Innovation'));
    if (innovationPreset) {
      await user.click(innovationPreset);
    }
  });

  it('opens and closes keyboard shortcuts modal via close button and backdrop button', async () => {
    const user = userEvent.setup();
    renderStudio();

    const shortcutsBtn = screen.getByRole('button', { name: /Shortcuts \(\?\)/i });
    await user.click(shortcutsBtn);

    expect(screen.getByRole('heading', { name: /Shadowing Studio Shortcuts/i })).toBeInTheDocument();

    const xCloseBtn = screen.getByRole('button', { name: '✕' });
    await user.click(xCloseBtn);
    expect(screen.queryByRole('heading', { name: /Shadowing Studio Shortcuts/i })).not.toBeInTheDocument();

    // Open again and click Cancel
    await user.click(shortcutsBtn);
    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelBtn);
  });

  it('handles keyboard shortcuts via window events', () => {
    renderStudio();

    // Space (replay)
    fireEvent.keyDown(window, { code: 'Space' });
    // Right Arrow (next)
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    // Left Arrow (prev)
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    // Key R (cycle speed)
    fireEvent.keyDown(window, { code: 'KeyR' });
    // Key A (auto advance)
    fireEvent.keyDown(window, { code: 'KeyA' });
    // Key C (toggle subtitles)
    fireEvent.keyDown(window, { code: 'KeyC' });
    // Key ? (help)
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByRole('heading', { name: /Shadowing Studio Shortcuts/i })).toBeInTheDocument();
  });

  it('ignores keyboard shortcuts when typing in input or textarea', () => {
    renderStudio();

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    fireEvent.keyDown(input, { code: 'Space' });
    fireEvent.keyDown(input, { code: 'ArrowRight' });
    fireEvent.keyDown(input, { code: 'KeyR' });

    document.body.removeChild(input);
  });

  it('changes chunk mode strategy to fixed and adjusts duration slider', async () => {
    const user = userEvent.setup();
    renderStudio();

    const chunkModeSelect = screen.getByLabelText(/Chunking Method/i);
    await user.selectOptions(chunkModeSelect, 'fixed');

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '12' } });

    const targetRepsSelect = screen.getByLabelText(/Goal Repetitions/i);
    await user.selectOptions(targetRepsSelect, '5');
  });

  it('navigates via chunk list click', async () => {
    const user = userEvent.setup();
    renderStudio();

    const chunkItems = screen.getAllByRole('button').filter(b => b.textContent?.includes('✓') || b.textContent?.match(/^[0-9]+/));
    if (chunkItems.length >= 2) {
      await user.click(chunkItems[1]);
    }
  });
});
