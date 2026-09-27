import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import {
  BookMarked,
  BrainCircuit,
  ChevronRight,
  Flame,
  Gauge,
  Library,
  Mic2,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ComponentType } from 'react';

import { dueCards, STARTER_CARDS, studyStats, type AppState, type CaptureInput } from '../../core';
import { translator } from '../../i18n';
import { practiceRepository } from '../../platform/storage';
import { CaptureForm } from '../shared/CaptureForm';
import { LibraryView } from './LibraryView';
import { ReviewView } from './ReviewView';
import { SettingsView } from './SettingsView';
import { ShadowView } from './ShadowView';

type View = 'today' | 'review' | 'shadow' | 'library' | 'settings';

interface NavItem {
  id: View;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  label: 'navToday' | 'navReview' | 'navShadow' | 'navLibrary' | 'navSettings';
}

const navigation: readonly NavItem[] = [
  { id: 'today', icon: Gauge, label: 'navToday' },
  { id: 'review', icon: BrainCircuit, label: 'navReview' },
  { id: 'shadow', icon: Mic2, label: 'navShadow' },
  { id: 'library', icon: Library, label: 'navLibrary' },
  { id: 'settings', icon: Settings, label: 'navSettings' },
];

export function DashboardApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [view, setView] = useState<View>('today');
  const [starterAdded, setStarterAdded] = useState(false);

  useEffect(() => {
    let active = true;
    void practiceRepository.load().then((loaded) => {
      if (active) setState(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const t = useMemo(() => translator(state?.settings.locale ?? 'en'), [state?.settings.locale]);

  async function capture(input: CaptureInput): Promise<boolean> {
    const result = await practiceRepository.capture(input);
    setState(result.state);
    return result.added;
  }

  async function addStarterPack() {
    for (const card of STARTER_CARDS) await practiceRepository.capture(card);
    setState(await practiceRepository.load());
    setStarterAdded(true);
  }

  if (state === null) {
    return (
      <div className="loading-screen" role="status">
        <div className="brand-mark brand-mark--pulse">
          <Flame size={24} />
        </div>
        <span>IELTS Forge</span>
      </div>
    );
  }

  const due = dueCards(state.cards, new Date()).length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Flame size={22} fill="currentColor" />
          </div>
          <div className="brand-copy">
            <strong>{t('appName')}</strong>
            <span>{t('appTagline')}</span>
          </div>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={view === item.id ? 'nav-item is-active' : 'nav-item'}
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{t(item.label)}</span>
                {item.id === 'review' && due > 0 && <b>{due}</b>}
              </button>
            );
          })}
        </nav>

        <div className="privacy-stamp">
          <ShieldCheck size={17} />
          <div>
            <strong>{t('localOnly')}</strong>
            <span>{t('noAccount')}</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        {view === 'today' && (
          <TodayView
            state={state}
            starterAdded={starterAdded}
            onAddStarter={addStarterPack}
            onCapture={capture}
            onStartReview={() => setView('review')}
          />
        )}
        {view === 'review' && <ReviewView state={state} setState={setState} t={t} />}
        {view === 'shadow' && <ShadowView state={state} t={t} />}
        {view === 'library' && <LibraryView state={state} setState={setState} t={t} />}
        {view === 'settings' && <SettingsView state={state} setState={setState} t={t} />}
      </main>
    </div>
  );
}

interface TodayViewProps {
  state: AppState;
  starterAdded: boolean;
  onAddStarter: () => Promise<void>;
  onCapture: (input: CaptureInput) => Promise<boolean>;
  onStartReview: () => void;
}

function TodayView({
  state,
  starterAdded,
  onAddStarter,
  onCapture,
  onStartReview,
}: TodayViewProps) {
  const t = translator(state.settings.locale);
  const stats = studyStats(state, new Date());

  return (
    <div className="view view--today">
      <header className="view-header hero-header">
        <div>
          <p className="eyebrow">
            <Sparkles size={14} /> {t('todayEyebrow')}
          </p>
          <Heading level={1}>{t('todayTitle')}</Heading>
          <Text as="p" type="large" color="secondary">
            {t('todayBody')}
          </Text>
        </div>
        <Badge variant="success" label={t('localOnly')} icon={<ShieldCheck size={13} />} />
      </header>

      <section className="stats-grid" aria-label="Practice statistics">
        <Metric icon={<BrainCircuit />} value={stats.due} label={t('dueNow')} accent="amber" />
        <Metric
          icon={<BookMarked />}
          value={stats.learned}
          label={t('cardsLearned')}
          accent="blue"
        />
        <Metric icon={<Flame />} value={stats.streak} label={t('dayStreak')} accent="coral" />
        <Metric
          icon={<Target />}
          value={`${stats.progress}%`}
          label={t('dailyTarget')}
          accent="green"
        />
      </section>

      <section className="today-grid">
        <Card className="mission-card" padding={5}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">FSRS · 90% retention</p>
              <Heading level={2}>{t('dailyTarget')}</Heading>
            </div>
            <span className="metric-orb">
              <BrainCircuit size={22} />
            </span>
          </div>
          <ProgressBar
            value={stats.reviewedToday}
            max={state.settings.dailyGoal}
            label={t('reviewsProgress', {
              done: stats.reviewedToday,
              goal: state.settings.dailyGoal,
            })}
            hasValueLabel
            variant="accent"
          />
          <div className="button-row">
            <Button
              label={t('startReview')}
              variant="primary"
              onClick={onStartReview}
              endContent={<ChevronRight size={16} />}
            />
            <Button
              label={starterAdded ? t('starterAdded') : t('addStarter')}
              variant="secondary"
              onClick={() => void onAddStarter()}
              isDisabled={starterAdded}
              icon={starterAdded ? <Sparkles size={16} /> : <Plus size={16} />}
            />
          </div>
        </Card>

        <Card className="capture-card" padding={5}>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">Context → recall</p>
              <Heading level={2}>{t('quickCapture')}</Heading>
              <Text as="p" type="supporting">
                {t('captureHint')}
              </Text>
            </div>
          </div>
          <CaptureForm onCapture={onCapture} t={t} />
        </Card>
      </section>
    </div>
  );
}

function Metric({
  icon,
  value,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  accent: string;
}) {
  return (
    <div className={`metric-card metric-card--${accent}`}>
      <span className="metric-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}
