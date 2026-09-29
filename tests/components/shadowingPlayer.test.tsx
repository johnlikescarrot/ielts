import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShadowingPlayer } from '../../src/components/video/ShadowingPlayer';

const cues = [
  { id: 'cue-1', startSeconds: 0, text: 'Research improves communities.' },
  { id: 'cue-2', startSeconds: 8, text: 'Practice builds confident speech.' },
];
let spoken: SpeechSynthesisUtterance | undefined;

describe('ShadowingPlayer', () => {
  beforeEach(() => {
    spoken = undefined;
    window.speechSynthesis = {
      cancel: vi.fn(), speak: vi.fn((utterance: SpeechSynthesisUtterance) => { spoken = utterance; }),
    } as unknown as SpeechSynthesis;
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('replays, changes speed, navigates, auto-advances and opens the timestamp', async () => {
    const user = userEvent.setup();
    render(<ShadowingPlayer cues={cues} videoId="dQw4w9WgXcQ" language="en" />);
    expect(screen.getByText('Research improves communities.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous cue' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '1.25×' }));
    await user.click(screen.getByRole('checkbox', { name: 'Auto-advance' }));
    await user.click(screen.getByRole('button', { name: 'Replay cue' }));
    expect(spoken?.rate).toBe(1.25);
    act(() => spoken?.onend?.call(spoken, new Event('end') as SpeechSynthesisEvent));
    expect(screen.getByText('Practice builds confident speech.')).toBeInTheDocument();
    expect(screen.getByText('Repetitions: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open source video' }));
    expect(window.open).toHaveBeenCalledWith(expect.stringContaining('&t=8s'), '_blank', 'noopener,noreferrer');
    await user.click(screen.getByRole('button', { name: 'Previous cue' }));
    await user.click(screen.getByRole('button', { name: 'Next cue' }));
    expect(screen.getByRole('button', { name: 'Next cue' })).toBeDisabled();
  });

  it('supports keyboard controls, clamps navigation, skips typing targets and localizes Vietnamese', () => {
    render(<><input aria-label="Outside input" /><ShadowingPlayer cues={cues} videoId={null} language="vi" /></>);
    expect(screen.getByRole('heading', { name: 'Phòng luyện Shadowing' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mở video gốc' })).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Practice builds confident speech.')).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'R' });
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.keyDown(window, { code: 'Space' });
    expect(spoken?.rate).toBe(1.25);
    act(() => spoken?.onend?.call(spoken, new Event('end') as SpeechSynthesisEvent));
    expect(screen.getByText('Lượt lặp: 1')).toBeInTheDocument();

    const input = screen.getByRole('textbox', { name: 'Outside input' });
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    expect(screen.getByText('Practice builds confident speech.')).toBeInTheDocument();
  });
});
