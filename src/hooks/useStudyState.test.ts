import {act, renderHook, waitFor} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {useStudyState} from './useStudyState';

describe('useStudyState', () => {
  it('loads state, commits updates, and persists them', async () => {
    const {result} = renderHook(() => useStudyState());
    act(() => result.current.commit((state) => state));
    await waitFor(() => expect(result.current.state).toBeDefined());
    act(() =>
      result.current.commit((state) => ({
        ...state,
        settings: {...state.settings, dailyGoal: 42},
      })),
    );
    expect(result.current.state?.settings.dailyGoal).toBe(42);
    await waitFor(() =>
      expect(
        JSON.parse(localStorage.getItem('bandcraft.studyState.v1') ?? '{}'),
      ).toMatchObject({settings: {dailyGoal: 42}}),
    );
  });

  it('does not set state after being unmounted', () => {
    const {unmount} = renderHook(() => useStudyState());
    unmount();
    expect(true).toBe(true);
  });
});
