import {useEffect, useState} from 'react';
import {Badge, Button, Theme} from '@astryxdesign/core';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import type {StudyState, Surface} from './types';
import {translate, type CopyKey} from './lib/i18n';
import {useStudyState} from './hooks/useStudyState';
import {Dashboard} from './components/Dashboard';
import {Vocabulary} from './components/Vocabulary';
import {Reading} from './components/Reading';
import {Writing} from './components/Writing';
import {Speaking} from './components/Speaking';
import {Listening} from './components/Listening';
import {Settings} from './components/Settings';
import {QuickPanel} from './components/QuickPanel';
import {dueCards} from './lib/metrics';

type View =
  | 'dashboard'
  | 'vocabulary'
  | 'reading'
  | 'writing'
  | 'listening'
  | 'speaking'
  | 'settings';

const nav: {id: View; icon: string}[] = [
  {id: 'dashboard', icon: '◫'},
  {id: 'vocabulary', icon: 'Aa'},
  {id: 'reading', icon: '¶'},
  {id: 'writing', icon: '✎'},
  {id: 'listening', icon: '♫'},
  {id: 'speaking', icon: '◉'},
  {id: 'settings', icon: '⚙'},
];

export function App({surface}: {surface: Surface}) {
  const {state, commit} = useStudyState();
  useEffect(() => {
    if (state) document.documentElement.lang = state.settings.locale;
  }, [state]);
  const locale = state?.settings.locale ?? 'en';
  const t = (key: CopyKey, values?: Record<string, string | number>) =>
    translate(locale, key, values);

  return (
    <Theme theme={neutralTheme} mode={state?.settings.theme ?? 'system'}>
      {!state ? (
        <main className="loading-screen">
          <span className="brand-glyph">B</span>
          <p>{t('loading')}</p>
        </main>
      ) : surface === 'popup' ? (
        <QuickPanel state={state} commit={commit} t={t} />
      ) : (
        <Studio
          state={state}
          commit={commit}
          t={t}
          compact={surface === 'sidebar'}
        />
      )}
    </Theme>
  );
}

interface StudioProps {
  state: StudyState;
  commit: (update: (state: StudyState) => StudyState) => void;
  t: (key: CopyKey, values?: Record<string, string | number>) => string;
  compact: boolean;
}

function Studio({state, commit, t, compact}: StudioProps) {
  const [view, setView] = useState<View>('dashboard');
  const due = dueCards(state.cards, new Date()).length;
  const content =
    view === 'dashboard' ? (
      <Dashboard
        state={state}
        t={t}
        onNavigate={(next) => setView(next as View)}
      />
    ) : view === 'vocabulary' ? (
      <Vocabulary state={state} commit={commit} t={t} />
    ) : view === 'reading' ? (
      <Reading state={state} t={t} />
    ) : view === 'writing' ? (
      <Writing state={state} commit={commit} t={t} />
    ) : view === 'listening' ? (
      <Listening state={state} commit={commit} t={t} />
    ) : view === 'speaking' ? (
      <Speaking state={state} commit={commit} t={t} />
    ) : (
      <Settings state={state} commit={commit} t={t} />
    );

  return (
    <div className={`studio ${compact ? 'studio-compact' : ''}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-glyph">B</span>
          <div>
            <strong>Bandcraft</strong>
            <small>IELTS STUDIO</small>
          </div>
        </div>
        <nav aria-label="Main navigation">
          {nav.map((item) => (
            <Button
              key={item.id}
              label={t(item.id)}
              variant={view === item.id ? 'secondary' : 'ghost'}
              width="100%"
              onClick={() => setView(item.id)}
              icon={
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
              }
              endContent={
                item.id === 'vocabulary' && due > 0 ? (
                  <Badge variant="orange" label={due} />
                ) : undefined
              }
            />
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="privacy-dot" />
          {t('privacy')}
        </div>
      </aside>
      <main className="workspace">{content}</main>
    </div>
  );
}
