import {useState} from 'react';
import {Badge, Button, Card, Heading, Text} from '@astryxdesign/core';
import {writingCriteria, writingPrompts} from '../data/prompts';
import type {StudyState} from '../types';
import {recordSession, saveDraft} from '../lib/model';
import {countWords, formatClock} from '../lib/metrics';
import {useCountdown} from '../hooks/useCountdown';
import type {CopyKey} from '../lib/i18n';

interface Props {
  state: StudyState;
  commit: (update: (state: StudyState) => StudyState) => void;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
}

export function Writing({state, commit, t}: Props) {
  const prompts = writingPrompts[state.settings.locale];
  const [promptId, setPromptId] = useState(prompts[0].id);
  const prompt = prompts.find((item) => item.id === promptId) ?? prompts[0];
  const stored = state.drafts.find((draft) => draft.taskId === prompt.id);
  const [body, setBody] = useState(stored?.body ?? '');
  const [checked, setChecked] = useState(stored?.checkedCriteria ?? []);
  const timer = useCountdown(prompt.minutes * 60);
  const criteria = writingCriteria[state.settings.locale];
  const words = countWords(body);

  const changePrompt = (id: string) => {
    const nextDraft = state.drafts.find((draft) => draft.taskId === id);
    setPromptId(id);
    setBody(nextDraft?.body ?? '');
    setChecked(nextDraft?.checkedCriteria ?? []);
  };
  const persist = (nextBody: string, nextChecked = checked) =>
    commit((current) =>
      saveDraft(current, prompt.id, nextBody, nextChecked, new Date()),
    );
  const toggleCriterion = (criterion: string) => {
    const next = checked.includes(criterion)
      ? checked.filter((item) => item !== criterion)
      : [...checked, criterion];
    setChecked(next);
    persist(body, next);
  };
  const complete = () => {
    persist(body);
    commit((current) =>
      recordSession(
        current,
        'writing',
        prompt.minutes - timer.remaining / 60,
        `${prompt.id}:${words}`,
        new Date(),
      ),
    );
    timer.reset();
  };

  return (
    <div className="view-stack">
      <div className="section-heading">
        <div>
          <Heading level={1}>{t('writingSprint')}</Heading>
          <Text as="p" color="secondary">
            Task response · Coherence · Lexis · Grammar
          </Text>
        </div>
        <Badge
          variant={timer.remaining < 300 ? 'warning' : 'orange'}
          label={formatClock(timer.remaining)}
        />
      </div>
      <label className="field">
        <span>Task</span>
        <select
          value={prompt.id}
          onChange={(event) => changePrompt(event.target.value)}
        >
          {prompts.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <Card padding={4} variant="muted">
        <Text as="p" type="large">
          {prompt.prompt}
        </Text>
      </Card>
      <div className="writing-layout">
        <label className="field writing-editor">
          <span>
            {t('words', {count: words})} · {prompt.minimumWords} minimum
          </span>
          <textarea
            value={body}
            rows={18}
            onChange={(event) => {
              setBody(event.target.value);
              persist(event.target.value);
            }}
          />
        </label>
        <aside className="criteria-panel">
          <Heading level={2}>{t('criteria')}</Heading>
          {criteria.map((criterion) => (
            <label className="check-row" key={criterion}>
              <input
                type="checkbox"
                checked={checked.includes(criterion)}
                onChange={() => toggleCriterion(criterion)}
              />
              <span>{criterion}</span>
            </label>
          ))}
        </aside>
      </div>
      <div className="action-row">
        <Button
          label={timer.running ? t('pauseTimer') : t('startTimer')}
          variant="primary"
          onClick={timer.toggle}
        />
        <Button label={t('markComplete')} onClick={complete} />
      </div>
    </div>
  );
}
