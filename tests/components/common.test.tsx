import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../../src/components/common/Badge';
import { Timer } from '../../src/components/common/Timer';
import { AudioPlayer } from '../../src/components/common/AudioPlayer';
import { VoiceRecorder } from '../../src/components/common/VoiceRecorder';
import { Navbar } from '../../src/components/common/Navbar';
import { I18nProvider } from '../../src/i18n/i18nContext';

describe('Common Components Suite', () => {
  beforeAll(() => {
    URL.createObjectURL = vi.fn(() => 'mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('renders Badge with various variants and sizes', () => {
    const { rerender } = render(<Badge variant="primary" size="sm">Primary</Badge>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Badge variant="success" size="md">Success</Badge>);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Badge variant="warning" size="lg">Warning</Badge>);
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toBeInTheDocument();

    rerender(<Badge variant="neutral">Neutral</Badge>);
    expect(screen.getByText('Neutral')).toBeInTheDocument();

    rerender(<Badge variant="purple">Purple</Badge>);
    expect(screen.getByText('Purple')).toBeInTheDocument();
  });

  it('manages Timer lifecycle: play, pause, reset, timeUp, countUp, lowTime', async () => {
    vi.useFakeTimers();
    const onTimeUp = vi.fn();

    // Low time test
    const { unmount } = render(
      <I18nProvider>
        <Timer initialSeconds={30} onTimeUp={onTimeUp} autoStart={true} />
      </I18nProvider>
    );
    expect(screen.getByText('00:30')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(onTimeUp).toHaveBeenCalled();
    unmount();

    // Count-up mode
    render(
      <I18nProvider>
        <Timer initialSeconds={0} countUp={true} autoStart={true} />
      </I18nProvider>
    );
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('00:05')).toBeInTheDocument();

    // Test pause / resume / reset
    const pauseBtn = screen.getByRole('button', { name: /Play|Pause/i });
    act(() => {
      fireEvent.click(pauseBtn);
    });
    const resetBtn = screen.getByRole('button', { name: /Reset/i });
    act(() => {
      fireEvent.click(resetBtn);
    });

    vi.useRealTimers();
  });

  it('interacts with AudioPlayer: play, pause, speed cycles, time updates, pauseAudio and restart', async () => {
    const onUpdate = vi.fn();
    render(
      <I18nProvider>
        <AudioPlayer
          transcriptText="Hello listening test."
          durationSeconds={10}
          onTimeUpdate={onUpdate}
        />
      </I18nProvider>
    );

    const playPauseBtn = screen.getByRole('button', { name: /Play|Pause/i });
    await userEvent.click(playPauseBtn);

    // Cycle speeds: 1x -> 1.25x -> 1.5x -> 0.75x -> 1x
    const speedBtn = screen.getByText('1x');
    await userEvent.click(speedBtn);
    expect(screen.getByText('1.25x')).toBeInTheDocument();

    // Pause audio
    await userEvent.click(screen.getByRole('button', { name: /Play|Pause/i }));

    const resetBtn = screen.getByTitle('Reset');
    await userEvent.click(resetBtn);
  });

  it('handles mic access denial in VoiceRecorder and falls back to mock recording', async () => {
    vi.useFakeTimers();
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('NotAllowedError: Permission denied'));

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onComplete = vi.fn();

    render(
      <I18nProvider>
        <VoiceRecorder onRecordingComplete={onComplete} />
      </I18nProvider>
    );

    const startBtn = screen.getByText(/Start Voice Recording|Bắt đầu Ghi âm/i);
    await act(async () => {
      fireEvent.click(startBtn);
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalledWith('VoiceRecorder: mic access error', expect.any(Error));
    expect(screen.getByText(/Stop Recording|Dừng Ghi âm/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const stopBtn = screen.getByText(/Stop Recording|Dừng Ghi âm/i);
    act(() => {
      fireEvent.click(stopBtn);
    });

    expect(onComplete).toHaveBeenCalledWith(expect.any(Blob), 2);

    navigator.mediaDevices.getUserMedia = originalGetUserMedia;
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  it('handles missing mediaDevices in VoiceRecorder and falls back to mock recording', async () => {
    vi.useFakeTimers();
    const originalNavigator = global.navigator;

    Object.defineProperty(global, 'navigator', {
      value: { ...originalNavigator, mediaDevices: undefined },
      writable: true,
      configurable: true,
    });

    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onComplete = vi.fn();

    render(
      <I18nProvider>
        <VoiceRecorder onRecordingComplete={onComplete} />
      </I18nProvider>
    );

    const startBtn = screen.getByText(/Start Voice Recording|Bắt đầu Ghi âm/i);
    await act(async () => {
      fireEvent.click(startBtn);
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalledWith('VoiceRecorder: mic access error', expect.any(Error));
    expect(screen.getByText(/Stop Recording|Dừng Ghi âm/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    const stopBtn = screen.getByText(/Stop Recording|Dừng Ghi âm/i);
    act(() => {
      fireEvent.click(stopBtn);
    });

    expect(onComplete).toHaveBeenCalledWith(expect.any(Blob), 2);

    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    consoleSpy.mockRestore();
    vi.useRealTimers();
  });

  it('interacts with VoiceRecorder: recording lifecycle and audio playback', async () => {
    vi.useFakeTimers();
    const originalNavigator = global.navigator;
    const mockMediaRecorder = {
      start: vi.fn(),
      stop: vi.fn(),
      state: 'inactive',
      onstop: null as any,
    };

    const mockStream = {
      getTracks: () => [{ stop: vi.fn() }],
    };

    Object.defineProperty(global, 'navigator', {
      value: {
        ...originalNavigator,
        mediaDevices: {
          getUserMedia: vi.fn().mockResolvedValue(mockStream),
        },
      },
      writable: true,
      configurable: true,
    });

    const OriginalMediaRecorder = global.MediaRecorder;
    global.MediaRecorder = class {
      constructor() {
        return mockMediaRecorder;
      }
    } as any;

    const onComplete = vi.fn();
    render(
      <I18nProvider>
        <VoiceRecorder onRecordingComplete={onComplete} />
      </I18nProvider>
    );

    const startBtn = screen.getByText(/Start Voice Recording/i);
    act(() => {
      fireEvent.click(startBtn);
    });

    await act(async () => {
      await Promise.resolve();
    });

    const stopBtn = screen.getByText(/Stop Recording/i);

    mockMediaRecorder.state = 'recording';
    mockMediaRecorder.stop.mockImplementation(() => {
      if (mockMediaRecorder.onstop) {
        mockMediaRecorder.onstop();
      }
    });

    act(() => {
      fireEvent.click(stopBtn);
    });

    expect(onComplete).toHaveBeenCalled();

    await act(async () => {
      await Promise.resolve();
    });

    // Play recorded audio
    const playAudioBtn = screen.getByText(/Listen to Your Recording|Nghe lại/i);
    act(() => {
      fireEvent.click(playAudioBtn);
    });
    act(() => {
      fireEvent.click(playAudioBtn);
    });

    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
    global.MediaRecorder = OriginalMediaRecorder;
    vi.useRealTimers();
  });

  it('renders Navbar on desktop and mobile', async () => {
    const onSelect = vi.fn();
    render(
      <I18nProvider>
        <Navbar activeTab="dashboard" onSelectTab={onSelect} targetBand={8.0} />
      </I18nProvider>
    );

    expect(screen.getByText(/IELTS/i)).toBeInTheDocument();
    expect(screen.getByText(/Target: Band 8.0/i)).toBeInTheDocument();

    // Logo click to dashboard
    const brand = screen.getByText('9.0');
    await userEvent.click(brand);
    expect(onSelect).toHaveBeenCalledWith('dashboard');

    // Language toggle
    const langBtn = screen.getByTitle('Switch English / Tiếng Việt');
    await userEvent.click(langBtn);

    // Mobile nav buttons click
    const mobileNavButtons = document.querySelectorAll('.md\\:hidden button');
    for (const btn of Array.from(mobileNavButtons)) {
      await userEvent.click(btn);
    }
  });
});
