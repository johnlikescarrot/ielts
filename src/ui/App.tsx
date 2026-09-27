import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Kbd } from '@astryxdesign/core/Kbd';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { dueCards, progressPercent, todayReviewCount } from '../domain/scheduler';
import type { AppState, Card as StudyCard, Grade, Locale } from '../domain/types';
import { translate, type MessageKey } from '../i18n';
import { useStudyStore } from './useStudyStore';

import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';
import '../styles/app.css';

type Page = 'dashboard' | 'review' | 'studio' | 'settings';
type NoticeKind = 'success' | 'error';
type Notice = { kind: NoticeKind; message: string } | null;

interface IeltsAppProps {
  compact?: boolean;
}

export function IeltsApp({ compact = false }: IeltsAppProps) {
  const store = useStudyStore();
  const [page, setPage] = useState<Page>('dashboard');
  const [notice, setNotice] = useState<Notice>(null);

  if (!store.state) {
    return <LoadingScreen />;
  }

  const locale = store.state.settings.locale;
  const t = (key: MessageKey) => translate(locale, key);
  const navigate = (next: Page) => {
    setNotice(null);
    setPage(next);
  };
  const tell = (kind: NoticeKind, message: string) => setNotice({ kind, message });

  return (
    <Theme theme={neutralTheme} mode={store.state.settings.theme}>
      <main className={`app-shell ${compact ? 'app-shell--compact' : ''}`}>
        <header className="topbar">
          <button className="brand" onClick={() => navigate('dashboard')} aria-label={t('appName')}>
            <span className="brand-mark" aria-hidden="true">
              F
            </span>
            <span>
              <strong>{t('appName')}</strong>
              <small>{t('privacyShort')}</small>
            </span>
          </button>
          <Badge label={`${store.state.cards.length} ${t('cardCount')}`} />
        </header>

        <nav className="nav-tabs" aria-label="Primary navigation">
          <NavButton active={page === 'dashboard'} onClick={() => navigate('dashboard')}>
            {t('dashboard')}
          </NavButton>
          <NavButton active={page === 'review'} onClick={() => navigate('review')}>
            {t('review')}
          </NavButton>
          {!compact && (
            <NavButton active={page === 'studio'} onClick={() => navigate('studio')}>
              {t('studio')}
            </NavButton>
          )}
          {!compact && (
            <NavButton active={page === 'settings'} onClick={() => navigate('settings')}>
              {t('settings')}
            </NavButton>
          )}
        </nav>

        {notice && (
          <div className={`notice notice--${notice.kind}`} role="status">
            <span>{notice.message}</span>
            <button aria-label={t('toastClose')} onClick={() => setNotice(null)}>
              ×
            </button>
          </div>
        )}

        {page === 'dashboard' && (
          <Dashboard
            state={store.state}
            t={t}
            compact={compact}
            onReview={() => navigate('review')}
            onAdd={(draft) => {
              store.add(draft);
              tell('success', t('savedCard'));
            }}
            onOpenStudio={() => (compact ? openOptionsPage() : navigate('studio'))}
          />
        )}
        {page === 'review' && (
          <Review
            state={store.state}
            t={t}
            onGrade={store.grade}
            onDone={() => navigate('dashboard')}
          />
        )}
        {!compact && page === 'studio' && (
          <ShadowStudio
            state={store.state}
            t={t}
            onSave={(cardId, outcome) => {
              store.saveShadowOutcome(cardId, outcome);
              tell('success', t('outcomeSaved'));
            }}
          />
        )}
        {!compact && page === 'settings' && (
          <Settings
            state={store.state}
            t={t}
            onSettings={store.setSettings}
            onImport={(backup) => {
              const imported = store.importBackup(backup);
              tell(imported ? 'success' : 'error', t(imported ? 'imported' : 'importError'));
            }}
            onReset={() => {
              if (window.confirm(t('resetConfirm'))) {
                store.reset();
                tell('success', t('saved'));
              }
            }}
          />
        )}
        <footer className="app-footer">{t('sourceNotice')}</footer>
      </main>
    </Theme>
  );
}

function LoadingScreen() {
  return <main className="loading-screen">Opening your private study space…</main>;
}

function NavButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      className={`nav-tab ${active ? 'nav-tab--active' : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      {children}
    </button>
  );
}

interface CommonProps {
  state: AppState;
  t: (key: MessageKey) => string;
}

function Dashboard({
  state,
  t,
  compact,
  onReview,
  onAdd,
  onOpenStudio
}: CommonProps & {
  compact: boolean;
  onReview: () => void;
  onAdd: (draft: Pick<StudyCard, 'front' | 'back' | 'context' | 'tags'>) => void;
  onOpenStudio: () => void;
}) {
  const now = new Date();
  const due = dueCards(state.cards, now);
  const reviewed = todayReviewCount(state, now);
  const progress = progressPercent(state, now);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [context, setContext] = useState('');
  const [tags, setTags] = useState('');
  const [formError, setFormError] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!front.trim() || !back.trim()) {
      setFormError(t('inputRequired'));
      return;
    }
    onAdd({ front, back, context, tags: tags.split(',') });
    setFront('');
    setBack('');
    setContext('');
    setTags('');
    setFormError('');
  };

  return (
    <section className="page page--dashboard">
      <div className="hero-row">
        <div>
          <p className="eyebrow">{t('dailyPulse')}</p>
          <h1>{t('tagline')}</h1>
        </div>
        <Card className="hero-stat">
          <strong>{due.length}</strong>
          <span>{t('dueNow')}</span>
        </Card>
      </div>

      <Card className="progress-card">
        <div className="progress-copy">
          <div>
            <strong>{reviewed}</strong> {t('reviewed')} ·{' '}
            <strong>{state.settings.dailyGoal}</strong> {t('dailyGoal')}
          </div>
          <span>{progress}%</span>
        </div>
        <div className="progress-track" aria-label={`${progress}% ${t('dailyGoal')}`}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <Button
          label={due.length ? t('continueReview') : t('startReview')}
          variant="primary"
          onClick={onReview}
          width="100%"
        />
      </Card>

      <div className="dashboard-grid">
        <Card className="panel quick-capture">
          <div className="panel-heading">
            <div>
              <h2>{t('quickCapture')}</h2>
              <p>{t('quickCaptureCopy')}</p>
            </div>
            <span className="pill">⌘</span>
          </div>
          <form onSubmit={submit}>
            <label>
              {t('term')}
              <input
                value={front}
                onChange={(event) => setFront(event.target.value)}
                placeholder="e.g. compelling"
              />
            </label>
            <label>
              {t('meaning')}
              <input
                value={back}
                onChange={(event) => setBack(event.target.value)}
                placeholder="clear and convincing"
              />
            </label>
            <label>
              {t('context')}
              <textarea
                value={context}
                onChange={(event) => setContext(event.target.value)}
                rows={2}
              />
            </label>
            <label>
              {t('tags')}
              <input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Writing, Task 2"
              />
            </label>
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <Button type="submit" label={t('saveCard')} variant="secondary" width="100%" />
          </form>
        </Card>

        <Card className="panel queue-panel">
          <div className="panel-heading">
            <div>
              <h2>{t('queue')}</h2>
              <p>
                {due.length} {t('dueNow')}
              </p>
            </div>
          </div>
          {due.length ? (
            <ol className="queue-list">
              {due.slice(0, 4).map((card, index) => (
                <li key={card.id}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>{card.front}</strong>
                    <small>{card.tags.join(' · ') || t('saved')}</small>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="empty-copy">{t('noQueue')}</p>
          )}
          {compact && (
            <Button label={t('openStudio')} variant="ghost" onClick={onOpenStudio} width="100%" />
          )}
        </Card>
      </div>
    </section>
  );
}

function Review({
  state,
  t,
  onGrade,
  onDone
}: CommonProps & { onGrade: (cardId: string, grade: Grade) => void; onDone: () => void }) {
  const due = dueCards(state.cards, new Date());
  const card = due[0];

  if (!card) {
    return (
      <section className="page completion" aria-live="polite">
        <div className="completion-mark">✓</div>
        <p className="eyebrow">{t('review')}</p>
        <h1>{t('reviewComplete')}</h1>
        <p>{t('reviewCompleteCopy')}</p>
        <Button label={t('goDashboard')} variant="primary" onClick={onDone} />
      </section>
    );
  }

  return (
    <ReviewSession
      key={card.id}
      card={card}
      dueCount={due.length}
      locale={state.settings.locale}
      t={t}
      onGrade={onGrade}
    />
  );
}

function ReviewSession({
  card,
  dueCount,
  locale,
  t,
  onGrade
}: {
  card: StudyCard;
  dueCount: number;
  locale: Locale;
  t: (key: MessageKey) => string;
  onGrade: (cardId: string, grade: Grade) => void;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
        return;
      if (event.code === 'Space') {
        event.preventDefault();
        setRevealed(true);
      }
      if (event.key.toLowerCase() === 'l') speakText(card.front, locale);
      const value = Number(event.key);
      if (revealed && (value === 1 || value === 2 || value === 3 || value === 4))
        onGrade(card.id, value);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, locale, onGrade, revealed]);

  return (
    <section className="page review-page">
      <div className="review-meta">
        <span>
          {dueCount} {t('dueNow')}
        </span>
        <span>{t('gradeHint')}</span>
      </div>
      <Card className="review-card">
        <div className="card-tags">
          {card.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <h1>{card.front}</h1>
        {revealed ? (
          <div className="answer-area">
            <p className="answer">{card.back}</p>
            {card.context && (
              <blockquote>
                <span>{t('context')}</span>
                {card.context}
              </blockquote>
            )}
          </div>
        ) : (
          <p className="answer-placeholder">{t('showAnswer')}</p>
        )}
        <div className="review-actions">
          <Button
            label={t('listen')}
            variant="ghost"
            onClick={() => speakText(card.front, locale)}
          />
          {!revealed && (
            <Button label={t('showAnswer')} variant="primary" onClick={() => setRevealed(true)} />
          )}
        </div>
      </Card>
      {revealed && <GradeButtons t={t} onGrade={(grade) => onGrade(card.id, grade)} />}
      <p className="shortcut-hint">
        <Kbd keys="space" /> {t('shortcutHelp')}
      </p>
    </section>
  );
}

function GradeButtons({
  t,
  onGrade
}: {
  t: (key: MessageKey) => string;
  onGrade: (value: Grade) => void;
}) {
  const grades: Array<[Grade, MessageKey]> = [
    [1, 'again'],
    [2, 'hard'],
    [3, 'good'],
    [4, 'easy']
  ];
  return (
    <div className="grade-grid">
      {grades.map(([value, label]) => (
        <button key={value} className={`grade grade--${value}`} onClick={() => onGrade(value)}>
          <Kbd keys={String(value)} />
          <span>{t(label)}</span>
        </button>
      ))}
    </div>
  );
}

function ShadowStudio({
  state,
  t,
  onSave
}: CommonProps & { onSave: (cardId: string, outcome: 'mastered' | 'practice') => void }) {
  const [cardId, setCardId] = useState(state.cards[0]?.id ?? '');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const card = state.cards.find((item) => item.id === cardId) ?? state.cards[0];

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    },
    [audioUrl]
  );

  if (!card) return null;

  const toggleRecording = async () => {
    if (recording && recorder.current) {
      recorder.current.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage(t('noMicrophone'));
      return;
    }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      const chunks: Blob[] = [];
      const nextRecorder = new MediaRecorder(media);
      nextRecorder.ondataavailable = (event) => chunks.push(event.data);
      nextRecorder.onstop = () => {
        setAudioUrl(
          URL.createObjectURL(new Blob(chunks, { type: nextRecorder.mimeType || 'audio/webm' }))
        );
        media.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      recorder.current = nextRecorder;
      nextRecorder.start();
      setMessage('');
      setRecording(true);
    } catch {
      setMessage(t('recorderError'));
    }
  };

  return (
    <section className="page studio-page">
      <p className="eyebrow">{t('shadowing')}</p>
      <h1>{t('shadowingCopy')}</h1>
      <Card className="studio-card">
        <label>
          {t('chooseCue')}
          <select value={card.id} onChange={(event) => setCardId(event.target.value)}>
            {state.cards.map((item) => (
              <option key={item.id} value={item.id}>
                {item.front}
              </option>
            ))}
          </select>
        </label>
        <div className="cue">
          <span className="cue-label">{card.front}</span>
          <p>{card.context || card.back}</p>
        </div>
        <div className="studio-actions">
          <Button
            label={t('playCue')}
            variant="secondary"
            onClick={() =>
              speakText(`${card.front}. ${card.context || card.back}`, state.settings.locale)
            }
          />
          <Button
            label={recording ? t('stopRecording') : t('startRecording')}
            variant={recording ? 'destructive' : 'primary'}
            onClick={() => void toggleRecording()}
          />
        </div>
        {recording && (
          <p className="recording">
            <span />
            {t('recording')}
          </p>
        )}
        {message && (
          <p className="form-error" role="alert">
            {message}
          </p>
        )}
        {audioUrl && (
          <div className="take">
            <strong>{t('yourTake')}</strong>
            <audio controls src={audioUrl} />
          </div>
        )}
      </Card>
      <div className="outcome-row">
        <Button
          label={t('mastered')}
          variant="primary"
          onClick={() => onSave(card.id, 'mastered')}
        />
        <Button
          label={t('practice')}
          variant="secondary"
          onClick={() => onSave(card.id, 'practice')}
        />
      </div>
      <p className="privacy-note">{t('privacyNote')}</p>
    </section>
  );
}

function Settings({
  state,
  t,
  onSettings,
  onImport,
  onReset
}: CommonProps & {
  onSettings: (settings: Partial<AppState['settings']>) => void;
  onImport: (value: unknown) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const exportBackup = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `focus-ielts-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const importFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      onImport(JSON.parse(await file.text()));
    } catch {
      onImport(null);
    }
    event.target.value = '';
  };

  return (
    <section className="page settings-page">
      <p className="eyebrow">{t('settings')}</p>
      <h1>{t('privacyNote')}</h1>
      <div className="settings-grid">
        <Card className="panel">
          <h2>{t('language')}</h2>
          <select
            value={state.settings.locale}
            onChange={(event) => onSettings({ locale: event.target.value as Locale })}
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </Card>
        <Card className="panel">
          <h2>{t('appearance')}</h2>
          <div className="choice-row">
            <Button
              label={t('light')}
              variant={state.settings.theme === 'light' ? 'primary' : 'secondary'}
              onClick={() => onSettings({ theme: 'light' })}
            />
            <Button
              label={t('dark')}
              variant={state.settings.theme === 'dark' ? 'primary' : 'secondary'}
              onClick={() => onSettings({ theme: 'dark' })}
            />
          </div>
        </Card>
        <Card className="panel">
          <h2>{t('dailyGoal')}</h2>
          <input
            type="number"
            min="1"
            max="100"
            value={state.settings.dailyGoal}
            onChange={(event) => onSettings({ dailyGoal: Number(event.target.value) })}
          />
        </Card>
        <Card className="panel">
          <h2>{t('backup')}</h2>
          <p>{t('backupCopy')}</p>
          <div className="choice-row">
            <Button label={t('export')} variant="secondary" onClick={exportBackup} />
            <Button
              label={t('import')}
              variant="secondary"
              onClick={() => fileRef.current?.click()}
            />
          </div>
          <input
            ref={fileRef}
            className="visually-hidden"
            type="file"
            accept="application/json"
            aria-label={t('importLabel')}
            onChange={importFile}
          />
        </Card>
      </div>
      <Button label={t('reset')} variant="destructive" onClick={onReset} />
    </section>
  );
}

function speakText(text: string, locale: Locale) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale === 'vi' ? 'vi-VN' : 'en-US';
  window.speechSynthesis.speak(utterance);
}

function openOptionsPage() {
  if (globalThis.browser?.runtime?.openOptionsPage) {
    void globalThis.browser.runtime.openOptionsPage();
    return;
  }
  window.open('/options.html', '_blank', 'noopener');
}
