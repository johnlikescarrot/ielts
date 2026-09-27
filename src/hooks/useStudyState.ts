import {useCallback, useEffect, useState} from 'react';
import type {StudyState} from '../types';
import {loadState, saveState} from '../lib/storage';

export function useStudyState() {
  const [state, setState] = useState<StudyState>();

  useEffect(() => {
    let active = true;
    void loadState().then((loaded) => {
      if (active) setState(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const commit = useCallback((update: (current: StudyState) => StudyState) => {
    setState((current) => {
      if (!current) return current;
      const next = update(current);
      void saveState(next);
      return next;
    });
  }, []);

  return {state, commit};
}
