import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AudioPlayer } from '../../src/components/common/AudioPlayer';
import { VoiceRecorder } from '../../src/components/common/VoiceRecorder';
import { I18nProvider } from '../../src/i18n/i18nContext';

describe('media edge cases', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('pauses, restarts at a new speed, reports progress, and reaches the audio end', () => {
    vi.useFakeTimers();
    const onTimeUpdate = vi.fn();
    const speak = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => undefined);
    const pause = vi.spyOn(window.speechSynthesis, 'pause');

    render(
      <I18nProvider>
        <AudioPlayer transcriptText="A short test." durationSeconds={2} onTimeUpdate={onTimeUpdate} />
      </I18nProvider>,
    );

    const playPause = screen.getByRole('button', { name: 'Play' });
    fireEvent.click(playPause);
    act(() => vi.advanceTimersByTime(1000));
    expect(onTimeUpdate).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(pause).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    fireEvent.click(screen.getByText('1x'));
    act(() => vi.advanceTimersByTime(100));
    act(() => vi.advanceTimersByTime(2000));

    expect(onTimeUpdate).toHaveBeenCalledWith(2);
    expect(speak).toHaveBeenCalled();
    speak.mockRestore();
    pause.mockRestore();
  });

  it('falls back to a local recording when microphone access is denied and resets playback state', async () => {
    const getUserMedia = vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(new Error('Denied'));
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    const logWarning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const complete = vi.fn();
    const { unmount } = render(
      <I18nProvider>
        <VoiceRecorder onRecordingComplete={complete} />
      </I18nProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByText('Start Voice Recording'));
    });
    await waitFor(() => expect(screen.getByText('Stop Recording')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Stop Recording'));
    await waitFor(() => expect(complete).toHaveBeenCalled());

    const audio = document.querySelector('audio')!;
    fireEvent.click(screen.getByText('Listen to Your Recording'));
    fireEvent.ended(audio);
    unmount();

    expect(revoke).toHaveBeenCalled();
    getUserMedia.mockRestore();
    revoke.mockRestore();
    logWarning.mockRestore();
  });
});
