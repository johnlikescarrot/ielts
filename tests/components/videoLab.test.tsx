import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

    await user.click(screen.getByRole('button', { name: 'Review vocabulary' }));
    expect(screen.getByRole('heading', { name: 'Academic vocabulary from this video' })).toBeInTheDocument();
    expect(screen.getByText('Phân tích chi tiết')).toBeInTheDocument();

    // Test Add to SRS button
    const addToSrsButtons = screen.getAllByRole('button', { name: /\+ Add to SRS/i });
    if (addToSrsButtons.length > 0) {
      await user.click(addToSrsButtons[0]);
      expect(screen.getByText(/✓ Saved to Deck/i)).toBeInTheDocument();
    }

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
    await user.click(screen.getByRole('tab', { name: /Bước 3 Từ vựng/i }));
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

  it('exercises Curated Library loading, shadow studio playback, and cue seeking', async () => {
    const user = userEvent.setup();
    renderLab();

    // Navigate to Curated Library tab (Step 5)
    await user.click(screen.getByRole('tab', { name: /Curated Library/i }));
    expect(screen.getByRole('heading', { name: 'IELTS Library' })).toBeInTheDocument();

    // Click "Add transcript" to switch back to source
    await user.click(screen.getByRole('button', { name: 'Add transcript' }));
    expect(screen.getByRole('heading', { name: 'Create your private video lesson' })).toBeInTheDocument();

    // Go back to Curated Library and load a lesson into studio
    await user.click(screen.getByRole('tab', { name: /Curated Library/i }));
    const loadButtons = screen.getAllByRole('button', { name: 'Load into Studio' });
    await user.click(loadButtons[0]);

    // Should now be in Shadowing Studio (Step 4)
    expect(screen.getByRole('region', { name: /Shadowing & Pronunciation Studio/i })).toBeInTheDocument();

    // Replay chunk
    const replayBtn = screen.getByRole('button', { name: /Replay Chunk/i });
    await user.click(replayBtn);

    // Next chunk and Prev chunk
    const nextBtn = screen.getByRole('button', { name: /Next Chunk/i });
    await user.click(nextBtn);
    const prevBtn = screen.getByRole('button', { name: /Previous Chunk/i });
    await user.click(prevBtn);

    // Toggle speed cycle
    const speedBtn = screen.getByTitle(/Cycle speed/i);
    await user.click(speedBtn);
    await user.click(speedBtn);

    // Toggle auto-advance and shadow echo pause
    const autoAdvanceCheckbox = screen.getByLabelText(/Auto-advance/i);
    await user.click(autoAdvanceCheckbox);
    const echoCheckbox = screen.getByLabelText(/Shadow Echo Pause/i);
    await user.click(echoCheckbox);

    // Toggle subtitles overlay CC
    const ccBtn = screen.getByTitle(/Toggle subtitles/i);
    await user.click(ccBtn);
    await user.click(ccBtn);

    // Mark as Mastered
    const masterBtn = screen.getByRole('button', { name: /Mark Mastered/i });
    await user.click(masterBtn);
    expect(screen.getByText(/Mastered/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Mastered/i }));

    // Search cues in timeline
    const searchInput = screen.getByPlaceholderText(/Search captions/i);
    await user.type(searchInput, 'society');
    expect(screen.getAllByText(/contemporary society/i).length).toBeGreaterThan(0);
    await user.clear(searchInput);

    // Click a cue in the timeline to seek
    const cueElements = screen.getAllByText(/In contemporary society|Adequate time|Rapid urbanization/i);
    if (cueElements.length > 0) {
      await user.click(cueElements[0]);
    }

    // Export SRT and VTT
    const exportSrtBtn = screen.getByRole('button', { name: /Export \.SRT/i });
    await user.click(exportSrtBtn);

    const exportVttBtn = screen.getByRole('button', { name: /Export \.VTT/i });
    await user.click(exportVttBtn);

    // Slicing toggle: uncheck cue boundaries to test fixed seconds
    const cueBoundaryCheckbox = screen.getByLabelText(/By Subtitle Cue/i);
    await user.click(cueBoundaryCheckbox);
    const chunkSizeInput = screen.getByTitle(/Chunk Size/i);
    fireEvent.change(chunkSizeInput, { target: { value: '12' } });
    await user.click(cueBoundaryCheckbox);
  });

  it('handles local audio/video file and SRT/VTT file uploads', async () => {
    const user = userEvent.setup();
    renderLab();

    // Switch to Local File tab
    await user.click(screen.getByRole('button', { name: 'Local File' }));
    expect(screen.getByText(/Local Audio \/ Video/i)).toBeInTheDocument();

    // Upload local video file
    const videoFile = new File(['fake video data'], 'ielts_lecture.mp4', { type: 'video/mp4' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    if (fileInputs[0]) {
      fireEvent.change(fileInputs[0], { target: { files: [videoFile] } });
      expect(screen.getByText('ielts_lecture.mp4')).toBeInTheDocument();
    }

    // Upload local subtitle file (.srt)
    const srtContent = `1\n00:00:00,000 --> 00:00:05,000\nIn contemporary society, maintaining a harmonious work-life balance is indispensable for individuals.\n\n2\n00:00:06,000 --> 00:00:12,000\nMany professionals struggle to allocate adequate resources for physical exercise and family commitments.\n\n3\n00:00:13,000 --> 00:00:20,000\nFurthermore, rapid urbanization often exacerbates daily commute times and environmental stress levels.`;
    const srtFile = new File([srtContent], 'subtitles.srt', { type: 'text/plain' });
    if (fileInputs[1]) {
      // Mock FileReader for jsdom
      const originalFileReader = global.FileReader;
      class MockFileReader {
        onload: any = null;
        readAsText(_f: any) {
          setTimeout(() => {
            if (this.onload) this.onload({ target: { result: srtContent } });
          }, 0);
        }
      }
      global.FileReader = MockFileReader as any;

      fireEvent.change(fileInputs[1], { target: { files: [srtFile] } });
      global.FileReader = originalFileReader;
    }

    // Switch to Step 4 Shadowing Studio
    await waitFor(() => expect(screen.getByRole('tab', { name: /Shadowing Studio/i })).not.toBeDisabled());
    await user.click(screen.getByRole('tab', { name: /Shadowing Studio/i }));
    expect(screen.getByRole('region', { name: /Shadowing & Pronunciation Studio/i })).toBeInTheDocument();

    // Trigger video element loadedmetadata and timeupdate
    const videoEl = document.querySelector('video');
    if (videoEl) {
      Object.defineProperty(videoEl, 'duration', { value: 120, writable: true, configurable: true });
      Object.defineProperty(videoEl, 'currentTime', { value: 5, writable: true, configurable: true });
      fireEvent.loadedMetadata(videoEl);
      fireEvent.timeUpdate(videoEl);
    }

    // Replay chunk with local video
    await user.click(screen.getByRole('button', { name: /Replay Chunk/i }));
    await user.click(screen.getByRole('button', { name: /Next Chunk/i }));
    await user.click(screen.getByRole('button', { name: /Previous Chunk/i }));

    // Switch back to Step 1 Add transcript and click YouTube tab
    await user.click(screen.getByRole('tab', { name: /Add transcript/i }));
    await user.click(screen.getByRole('button', { name: 'YouTube' }));
    expect(screen.getByPlaceholderText(/youtube\.com/i)).toBeInTheDocument();
  });

  it('tests voice recording, evaluation, and keyboard shortcuts in Shadowing Studio', async () => {
    renderLab();

    // Load sample and start shadowing
    fireEvent.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    fireEvent.click(screen.getByRole('button', { name: /Start Shadowing Practice/i }));

    // Start Recording
    const recordBtn = screen.getByRole('button', { name: /Record Shadowing/i });
    fireEvent.click(recordBtn);

    // Stop recording
    await waitFor(() => expect(screen.getByRole('button', { name: /Stop Recording/i })).toBeInTheDocument());
    const stopBtn = screen.getByRole('button', { name: /Stop Recording/i });
    fireEvent.click(stopBtn);

    // Check pronunciation result display
    await waitFor(() => expect(screen.getAllByText(/Band 9\.0/i).length).toBeGreaterThan(0));

    // Play recorded voice
    const listenVoiceBtn = screen.getByRole('button', { name: /Play My Voice/i });
    fireEvent.click(listenVoiceBtn);

    // Test Keyboard shortcuts: Space, ArrowRight, ArrowLeft, KeyR, KeyM, KeyA, KeyS
    fireEvent.keyDown(window, { code: 'Space' });
    fireEvent.keyDown(window, { code: 'ArrowRight' });
    fireEvent.keyDown(window, { code: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.keyDown(window, { key: 'm' });
    fireEvent.keyDown(window, { key: 'm' });
    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 's' });

    // Keyboard shortcuts inside input shouldn't trigger
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { code: 'Space', bubbles: true });
  });

  it('switches between Shadowing Studio and Vocabulary tabs directly', async () => {
    renderLab();

    fireEvent.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create listening lesson' }));

    // Go to vocabulary
    fireEvent.click(screen.getByRole('button', { name: 'Review vocabulary' }));

    // Click "Shadowing Studio" button from vocabulary view
    fireEvent.click(screen.getByRole('button', { name: /Shadowing Studio/i }));
    expect(screen.getByRole('region', { name: /Shadowing & Pronunciation Studio/i })).toBeInTheDocument();
  });

  it('tests playback speed controls, echo pause, cue filter, export buttons, and local video events', async () => {
    const user = userEvent.setup();
    renderLab();

    // Click sample transcript
    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.click(screen.getByRole('button', { name: /Start Shadowing Practice/i }));

    // Toggle chunk by cue checkbox
    const chunkByCueCheckbox = screen.getByLabelText(/By Subtitle Cue/i);
    await user.click(chunkByCueCheckbox);

    // Toggle Auto Advance and Echo Pause
    const autoAdvanceCheckbox = screen.getByLabelText(/Auto-advance/i);
    await user.click(autoAdvanceCheckbox);
    expect(autoAdvanceCheckbox).toBeChecked();

    const echoPauseCheckbox = screen.getByLabelText(/Shadow Echo Pause/i);
    await user.click(echoPauseCheckbox);
    expect(echoPauseCheckbox).toBeChecked();

    // Cycle speed button
    const speedCycleBtn = screen.getByTitle(/Cycle speed/i);
    await user.click(speedCycleBtn);
    await user.click(speedCycleBtn);

    // Subtitles toggle button
    const subtitlesBtn = screen.getByTitle(/Toggle subtitles/i);
    await user.click(subtitlesBtn);

    // Mark Mastered button
    const markMasteredBtn = screen.getByRole('button', { name: /Mark Mastered/i });
    await user.click(markMasteredBtn);

    // Filter cues search
    const searchInput = screen.getByPlaceholderText(/Search captions/i);
    fireEvent.change(searchInput, { target: { value: 'sustainable' } });

    // Export buttons
    const exportSrtBtn = screen.getByRole('button', { name: /Export \.SRT/i });
    await user.click(exportSrtBtn);

    const exportVttBtn = screen.getByRole('button', { name: /Export \.VTT/i });
    await user.click(exportVttBtn);

    // Click on a cue item
    const cueItems = screen.getAllByText(/sustainable/i);
    if (cueItems.length > 0) {
      fireEvent.click(cueItems[0]);
    }
  });

  it('handles microphone errors gracefully with simulated fallback recording', async () => {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'));

    const user = userEvent.setup();
    renderLab();

    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.click(screen.getByRole('button', { name: /Start Shadowing Practice/i }));

    // Click Record button when mic is denied
    const recordBtn = screen.getByRole('button', { name: /Record Shadow/i });
    await user.click(recordBtn);

    // Should enter fallback recording
    expect(screen.getByRole('button', { name: /Stop & Evaluate|Recording/i })).toBeInTheDocument();

    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  });
});

