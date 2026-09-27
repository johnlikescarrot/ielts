import {useState} from 'react';
import {Badge, Button, Card, Heading, Text} from '@astryxdesign/core';
import {speakingCriteria, speakingPrompts} from '../data/prompts';
import type {StudyState} from '../types';
import {recordSession} from '../lib/model';
import {formatClock} from '../lib/metrics';
import {useCountdown} from '../hooks/useCountdown';
import {useRecorder} from '../hooks/useRecorder';
import type {CopyKey} from '../lib/i18n';

interface Props {
  state: StudyState;
  commit: (update: (state: StudyState) => StudyState) => void;
  t: (key: CopyKey) => string;
}

export function Speaking({state, commit, t}: Props) {
  const prompts = speakingPrompts[state.settings.locale];
  const [index, setIndex] = useState(0);
  const prompt = prompts[index % prompts.length];
  const prep = useCountdown(60);
  const answer = useCountdown(120);
  const recording = useRecorder();
  const next = () => {
    setIndex((current) => current + 1);
    prep.reset();
    answer.reset();
  };
  const stop = () => {
    recording.stop();
    answer.toggle();
    commit((current) =>
      recordSession(current, 'speaking', 2, prompt.id, new Date()),
    );
  };

  return (
    <div className="view-stack">
      <div className="section-heading">
        <div>
          <Heading level={1}>{t('speakingLab')}</Heading>
          <Text as="p" color="secondary">
            1 minute to prepare · up to 2 minutes to speak
          </Text>
        </div>
        <Badge variant="purple" label={prompt.topic} />
      </div>
      <Card padding={6} elevation="low">
        <div className="cue-card">
          <Text as="span" type="supporting" color="secondary">
            Part 2
          </Text>
          <Heading level={2} type="display-3">
            {prompt.question}
          </Heading>
          <ul>
            {prompt.points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      </Card>
      <div className="timer-grid">
        <Card padding={4} variant="muted">
          <Timer
            label={t('prep')}
            time={prep.remaining}
            running={prep.running}
            onClick={prep.toggle}
          />
        </Card>
        <Card padding={4} variant="muted">
          <Timer
            label={t('answer')}
            time={answer.remaining}
            running={answer.running}
            onClick={answer.toggle}
          />
        </Card>
      </div>
      <div className="action-row">
        <Button
          label={recording.recording ? t('stop') : t('record')}
          variant="primary"
          clickAction={recording.recording ? stop : recording.start}
        />
        <Button label={t('newPrompt')} onClick={next} />
      </div>
      {recording.audioUrl ? (
        <Card padding={4} variant="green">
          <Text as="p">{t('recordingReady')}</Text>
          <audio className="audio-player" src={recording.audioUrl} controls />
        </Card>
      ) : null}
      <section className="section-block">
        <Heading level={2}>{t('criteria')}</Heading>
        <div className="chip-row">
          {speakingCriteria[state.settings.locale].map((criterion) => (
            <Badge key={criterion} variant="neutral" label={criterion} />
          ))}
        </div>
      </section>
    </div>
  );
}

function Timer({
  label,
  time,
  running,
  onClick,
}: {
  label: string;
  time: number;
  running: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`timer ${running ? 'timer-running' : ''}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <strong>{formatClock(time)}</strong>
    </button>
  );
}
