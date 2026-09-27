import {act, renderHook, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {useRecorder} from './useRecorder';

class FakeRecorder {
  mimeType = 'audio/webm';
  listeners: Record<string, ((event: {data: Blob}) => void)[]> = {};
  addEventListener(name: string, listener: (event: {data: Blob}) => void) {
    this.listeners[name] = [...(this.listeners[name] ?? []), listener];
  }
  start = vi.fn();
  stop = vi.fn(() => {
    this.listeners.dataavailable?.forEach((listener) =>
      listener({data: new Blob(['voice'])}),
    );
    this.listeners.stop?.forEach((listener) => listener({data: new Blob()}));
  });
}

describe('useRecorder', () => {
  const stopTrack = vi.fn();
  let clock = 1000;
  beforeEach(() => {
    clock = 1000;
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn(async () => ({
          getTracks: () => [{stop: stopTrack}],
        })),
      },
    });
    vi.spyOn(performance, 'now').mockImplementation(() => clock);
  });

  it('records, creates playable audio, stops tracks, and replaces old URLs', async () => {
    const {result} = renderHook(() => useRecorder());
    await act(async () => result.current.start());
    expect(result.current.recording).toBe(true);
    clock = 3500;
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.audioUrl).toBe('blob:test'));
    expect(result.current.duration).toBe(2.5);
    expect(stopTrack).toHaveBeenCalled();

    await act(async () => result.current.start());
    act(() => result.current.stop());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });

  it('allows stop before a recorder exists', () => {
    const {result} = renderHook(() => useRecorder());
    act(() => result.current.stop());
    expect(result.current.recording).toBe(false);
  });
});
