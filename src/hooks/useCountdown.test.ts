import {act, renderHook} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {useCountdown} from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('toggles, ticks to zero, resets, and reacts to duration changes', () => {
    const {result, rerender} = renderHook(
      ({seconds}) => useCountdown(seconds),
      {initialProps: {seconds: 2}},
    );
    expect(result.current).toMatchObject({remaining: 2, running: false});
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toMatchObject({remaining: 1, running: true});
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toMatchObject({remaining: 0, running: false});
    act(() => result.current.reset());
    expect(result.current.remaining).toBe(2);
    act(() => result.current.toggle());
    act(() => result.current.toggle());
    expect(result.current.running).toBe(false);
    rerender({seconds: 5});
    expect(result.current).toMatchObject({remaining: 5, running: false});
  });
});
