import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../../src/components/common/Badge';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { Timer } from '../../src/components/common/Timer';
import { AudioPlayer } from '../../src/components/common/AudioPlayer';
import { VoiceRecorder } from '../../src/components/common/VoiceRecorder';
import { Navbar } from '../../src/components/common/Navbar';
import { I18nProvider } from '../../src/i18n/i18nContext';

describe('Common Components Suite', () => {
  it('renders Badge with various variants and sizes', () => {
    const { rerender } = render(
      <Badge variant="primary" size="sm">
        Primary
      </Badge>,
    );
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(
      <Badge variant="success" size="md">
        Success
      </Badge>,
    );
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(
      <Badge variant="warning" size="lg">
        Warning
      </Badge>,
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toBeInTheDocument();

    rerender(<Badge variant="neutral">Neutral</Badge>);
    expect(screen.getByText('Neutral')).toBeInTheDocument();

    rerender(<Badge variant="purple">Purple</Badge>);
    expect(screen.getByText('Purple')).toBeInTheDocument();
  });

  it('renders ProgressBar with color variations and percentage hiding', () => {
    const { rerender } = render(
      <ProgressBar
        value={75}
        max={100}
        label="Task Progress"
        sublabel="75/100"
        color="emerald"
        showPercentage={true}
      />,
    );
    expect(screen.getByText('Task Progress')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();

    rerender(<ProgressBar value={50} max={100} color="amber" showPercentage={false} />);

    rerender(<ProgressBar value={20} color="rose" />);
    rerender(<ProgressBar value={90} color="purple" />);
    rerender(<ProgressBar value={10} color="indigo" />);
  });

  it('manages Timer lifecycle: play, pause, reset, timeUp, countUp', async () => {
    vi.useFakeTimers();
    const onTimeUp = vi.fn();

    render(
      <I18nProvider>
        <Timer initialSeconds={3} onTimeUp={onTimeUp} autoStart={true} />
      </I18nProvider>,
    );

    expect(screen.getByText('00:03')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onTimeUp).toHaveBeenCalled();

    // Test pause / resume
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

  it('interacts with AudioPlayer: play, pause, speed cycles, time updates and restart', async () => {
    const onUpdate = vi.fn();
    render(
      <I18nProvider>
        <AudioPlayer transcriptText="Hello listening test." durationSeconds={10} onTimeUpdate={onUpdate} />
      </I18nProvider>,
    );

    const playPauseBtn = screen.getByRole('button', { name: /Play|Pause/i });
    await userEvent.click(playPauseBtn);

    // Cycle speeds: 1x -> 1.25x -> 1.5x -> 0.75x -> 1x
    const speedBtn = screen.getByText('1x');
    await userEvent.click(speedBtn);
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    await userEvent.click(screen.getByText('1.25x'));
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    await userEvent.click(screen.getByText('1.5x'));
    expect(screen.getByText('0.75x')).toBeInTheDocument();
    await userEvent.click(screen.getByText('0.75x'));
    expect(screen.getByText('1x')).toBeInTheDocument();

    const resetBtn = screen.getByTitle('Reset');
    await userEvent.click(resetBtn);
  });

  it('interacts with VoiceRecorder: recording lifecycle and audio playback', async () => {
    const onComplete = vi.fn();
    render(
      <I18nProvider>
        <VoiceRecorder onRecordingComplete={onComplete} />
      </I18nProvider>,
    );

    const startBtn = screen.getByText(/Start Voice Recording/i);
    await userEvent.click(startBtn);

    const stopBtn = screen.getByText(/Stop Recording/i);
    await userEvent.click(stopBtn);

    expect(onComplete).toHaveBeenCalled();

    // Play recorded audio
    const playAudioBtn = screen.getByText(/Listen to Your Recording|Nghe lại/i);
    await userEvent.click(playAudioBtn);
    await userEvent.click(playAudioBtn);
  });

  it('renders Navbar on desktop and mobile', async () => {
    const onSelect = vi.fn();
    render(
      <I18nProvider>
        <Navbar activeTab="dashboard" onSelectTab={onSelect} targetBand={8.0} />
      </I18nProvider>,
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

    // Mobile menu toggle
    const mobileMenuBtn = document.querySelector('button.md\\:hidden');
    if (mobileMenuBtn) {
      await userEvent.click(mobileMenuBtn);
      await userEvent.click(mobileMenuBtn);
    }
  });
});
