import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { BookOpen, Check, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import type { CaptureInput, Skill } from '../../core/types';
import type { MessageKey } from '../../i18n';

interface CaptureFormProps {
  initial?: CaptureInput;
  compact?: boolean;
  onCapture: (input: CaptureInput) => Promise<boolean>;
  t: (key: MessageKey) => string;
}

const skills: readonly Skill[] = ['reading', 'listening', 'writing', 'speaking'];

export function CaptureForm({ initial, compact = false, onCapture, t }: CaptureFormProps) {
  const [prompt, setPrompt] = useState(initial?.prompt ?? '');
  const [context, setContext] = useState(initial?.context ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [skill, setSkill] = useState<Skill>(initial?.skill ?? 'reading');
  const [status, setStatus] = useState<'idle' | 'required' | 'saved' | 'duplicate'>('idle');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (prompt.trim() === '') {
      setStatus('required');
      return;
    }
    setSaving(true);
    const added = await onCapture({
      prompt,
      context,
      answer,
      skill,
      source: initial?.source,
    });
    setSaving(false);
    setStatus(added ? 'saved' : 'duplicate');
    if (added && !compact) {
      setPrompt('');
      setContext('');
      setAnswer('');
    }
  }

  return (
    <form
      className={compact ? 'capture-form capture-form--compact' : 'capture-form'}
      onSubmit={submit}
    >
      <TextInput
        label={t('promptLabel')}
        value={prompt}
        onChange={(value) => {
          setPrompt(value);
          setStatus('idle');
        }}
        placeholder={t('promptPlaceholder')}
        width="100%"
        hasAutoFocus={compact}
        status={status === 'required' ? { type: 'error', message: t('required') } : undefined}
      />
      <label className="field-label" htmlFor="capture-context">
        {t('contextLabel')}
      </label>
      <textarea
        className="forge-textarea"
        id="capture-context"
        value={context}
        onChange={(event) => setContext(event.target.value)}
        placeholder={t('contextPlaceholder')}
        rows={compact ? 2 : 3}
      />
      {!compact && (
        <TextInput
          label={t('answerLabel')}
          value={answer}
          onChange={setAnswer}
          placeholder={t('answerPlaceholder')}
          width="100%"
        />
      )}
      <div className="capture-form__footer">
        {!compact && (
          <div className="skill-picker" aria-label={t('skillLabel')}>
            {skills.map((candidate) => (
              <button
                className={skill === candidate ? 'skill-chip is-active' : 'skill-chip'}
                key={candidate}
                onClick={() => setSkill(candidate)}
                type="button"
              >
                {t(candidate)}
              </button>
            ))}
          </div>
        )}
        <Button
          label={t('saveCard')}
          variant="primary"
          type="submit"
          isLoading={saving}
          icon={
            status === 'saved' ? (
              <Check size={16} />
            ) : compact ? (
              <Plus size={16} />
            ) : (
              <BookOpen size={16} />
            )
          }
        />
      </div>
      {(status === 'saved' || status === 'duplicate') && (
        <p className={`form-status form-status--${status}`} role="status">
          <Check size={14} aria-hidden="true" /> {t(status)}
        </p>
      )}
    </form>
  );
}
