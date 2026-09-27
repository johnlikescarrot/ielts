import { useCallback, useEffect, useState } from 'react';
import { addCard, gradeCard, markShadowOutcome, updateSettings } from '../domain/scheduler';
import { createInitialState } from '../domain/seed';
import { parseState } from '../domain/validate';
import type { AppState, CardDraft, Grade, ShadowSession } from '../domain/types';
import { loadState, resetState, saveState } from '../platform/storage';

export function useStudyStore() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    void loadState().then(setState);
  }, []);

  const commit = useCallback((reduce: (current: AppState) => AppState) => {
    setState((current) => {
      const next = reduce(current ?? createInitialState());
      void saveState(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (draft: CardDraft) => commit((current) => addCard(current, draft, new Date())),
    [commit]
  );
  const grade = useCallback(
    (cardId: string, value: Grade) =>
      commit((current) => gradeCard(current, cardId, value, new Date())),
    [commit]
  );
  const setSettings = useCallback(
    (settings: Partial<AppState['settings']>) =>
      commit((current) => updateSettings(current, settings)),
    [commit]
  );
  const saveShadowOutcome = useCallback(
    (cardId: string, outcome: ShadowSession['outcome']) =>
      commit((current) => markShadowOutcome(current, cardId, outcome, new Date())),
    [commit]
  );
  const importBackup = useCallback((value: unknown): boolean => {
    const imported = parseState(value);
    if (!imported) {
      return false;
    }
    setState(imported);
    void saveState(imported);
    return true;
  }, []);
  const reset = useCallback(() => {
    void resetState().then(setState);
  }, []);

  return { state, add, grade, setSettings, saveShadowOutcome, importBackup, reset };
}
