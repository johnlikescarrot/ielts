import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { ShadowingPlayer } from '../../src/components/video/ShadowingPlayer';

const cues = [
  { id: 'cue-1', startSeconds: 0, text: 'First practice sentence.' },
  { id: 'cue-2', startSeconds: 5, text: 'Second practice sentence.' },
];

const renderPlayer = () => render(<I18nProvider><ShadowingPlayer cues={cues} /></I18nProvider>);

describe('ShadowingPlayer', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(window.speechSynthesis, 'cancel').mockImplementation(() => undefined);
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation(() => undefined);
  });

  it('supports transcript-only replay, navigation, speed, and shortcuts', async () => {
    const user = userEvent.setup();
    renderPlayer();
    expect(screen.getByRole('heading', { name: 'Shadowing player' })).toBeInTheDocument();
    expect(screen.getByText('First practice sentence.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Replay current chunk' }));
    expect(window.speechSynthesis.speak).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByText('Second practice sentence.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Playback speed' }));
    expect(screen.getByRole('button', { name: 'Playback speed' })).toHaveTextContent('1.25');
    await user.keyboard('r');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard(' ');
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });

  it('loads local audio and updates the native media state', async () => {
    const user = userEvent.setup();
    renderPlayer();
    const input = screen.getByLabelText('Load local media');
    const file = new File(['audio'], 'practice.mp3', { type: 'audio/mpeg' });
    await user.upload(input, file);
    const audio = screen.getByLabelText('Local practice media') as HTMLAudioElement;
    Object.defineProperty(audio, 'duration', { value: 12, configurable: true });
    audio.dispatchEvent(new Event('loadedmetadata'));
    Object.defineProperty(audio, 'currentTime', { value: 6, configurable: true });
    audio.dispatchEvent(new Event('timeupdate'));
    audio.dispatchEvent(new Event('play'));
    expect(audio).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Second practice sentence.')).toBeInTheDocument());
  });
});
