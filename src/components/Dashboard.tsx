import {
  Badge,
  Button,
  Card,
  Heading,
  ProgressBar,
  Text,
} from '@astryxdesign/core';
import type {StudyState} from '../types';
import {dueCards, practiceStreak} from '../lib/metrics';
import type {CopyKey} from '../lib/i18n';

interface Props {
  state: StudyState;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
  onNavigate: (view: string) => void;
}

export function Dashboard({state, t, onNavigate}: Props) {
  const now = new Date();
  const due = dueCards(state.cards, now).length;
  const today = now.toISOString().slice(0, 10);
  const todayMinutes = state.sessions
    .filter((session) => session.completedAt.startsWith(today))
    .reduce((total, session) => total + session.minutes, 0);
  const totalMinutes = state.sessions.reduce(
    (total, session) => total + session.minutes,
    0,
  );
  const streak = practiceStreak(state.sessions, now);

  return (
    <div className="view-stack">
      <section className="hero">
        <div>
          <Badge variant="orange" label={`Band ${state.settings.targetBand}`} />
          <Heading level={1} type="display-3">
            {t('dashboard')}
          </Heading>
          <Text as="p" type="large" color="secondary">
            {t('tagline')}
          </Text>
        </div>
        <div className="hero-mark" aria-hidden="true">
          B{state.settings.targetBand}
        </div>
      </section>

      <section className="metric-grid" aria-label={t('dashboard')}>
        <Card padding={4} variant="orange">
          <Metric value={due} label={t('dueNow')} />
        </Card>
        <Card padding={4}>
          <Metric value={streak} label={t('streak')} />
        </Card>
        <Card padding={4}>
          <Metric value={totalMinutes} label={t('minutes')} />
        </Card>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <Heading level={2}>{t('todayPlan')}</Heading>
            <Text as="p" color="secondary">
              {todayMinutes} / {state.settings.dailyGoal}{' '}
              {t('minutes').toLocaleLowerCase()}
            </Text>
          </div>
          <Badge
            variant={
              todayMinutes >= state.settings.dailyGoal ? 'success' : 'neutral'
            }
            label={`${Math.min(100, Math.round((todayMinutes / state.settings.dailyGoal) * 100))}%`}
          />
        </div>
        <ProgressBar
          value={todayMinutes}
          max={state.settings.dailyGoal}
          label={t('dailyGoal')}
          isLabelHidden
        />
        <div className="plan-list">
          <PlanItem
            number="01"
            text={t('planVocabulary', {count: due})}
            action={t('reviewNow')}
            onClick={() => onNavigate('vocabulary')}
            primary={due > 0}
          />
          <PlanItem
            number="02"
            text={t('planWriting')}
            action={t('writing')}
            onClick={() => onNavigate('writing')}
          />
          <PlanItem
            number="03"
            text={t('planSpeaking')}
            action={t('speaking')}
            onClick={() => onNavigate('speaking')}
          />
        </div>
      </section>

      <Card padding={4} variant="muted">
        <div className="research-note">
          <span className="research-icon" aria-hidden="true">
            ⌁
          </span>
          <div>
            <Heading level={3}>{t('research')}</Heading>
            <Text as="p" color="secondary">
              {t('researchBody')}
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Metric({value, label}: {value: number; label: string}) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <Text as="span" color="secondary">
        {label}
      </Text>
    </div>
  );
}

function PlanItem({
  number,
  text,
  action,
  onClick,
  primary = false,
}: {
  number: string;
  text: string;
  action: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <div className="plan-item">
      <span className="plan-number">{number}</span>
      <Text as="span" weight="medium">
        {text}
      </Text>
      <Button
        label={action}
        size="sm"
        variant={primary ? 'primary' : 'secondary'}
        onClick={onClick}
      />
    </div>
  );
}
