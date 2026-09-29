import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, ExternalLink, Keyboard, Mic, Play, RotateCcw, SkipBack, SkipForward, Sparkles } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { useI18n } from '../../i18n/i18nContext';
import { formatTimestamp, getYouTubeVideoId, VideoLesson } from '../../video/videoLesson';
import { storageService } from '../../storage/storageService';
import { ProgressBar } from '../common/ProgressBar';
import { VoiceRecorder } from '../common/VoiceRecorder';
import {
  buildShadowingChunks,
  createShadowingSession,
  cyclePlaybackSpeed,
  DEFAULT_CHUNK_SECONDS,
  getSessionStats,
  isChunkDue,
  isChunkMastered,
  isValidShadowingSessionRecord,
  mapShadowingShortcut,
  pickNextChunkId,
  rateChunk,
  selectActiveChunk,
  ShadowingRating,
  ShadowingSession,
  ShadowingSessionRecord,
  SHADOWING_SPEEDS,
  summarizeSession,
} from '../../shadowing/shadowingEngine';

/** Chunk length presets spanning the reference player's 3–120 s range. */
const CHUNK_LENGTH_OPTIONS = [3, 5, 8, 15, 30, 60, 120];

const newRecordId = (): string => `shadowing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export interface ShadowingStudioViewProps {
  lesson: VideoLesson;
  sourceUrl: string;
  onNewLesson: () => void;
}

/**
 * Private, keyboard-driven shadowing coach. Chunks the lesson transcript,
 * replays each chunk with browser speech at a chosen speed, and schedules
 * self-rated chunks for spaced review with SM-2. Nothing leaves the device.
 */
export const ShadowingStudioView: React.FC<ShadowingStudioViewProps> = ({ lesson, sourceUrl, onNewLesson }) => {
  const { language, t } = useI18n();
  const [targetSeconds, setTargetSeconds] = useState(DEFAULT_CHUNK_SECONDS);
  const [session, setSession] = useState<ShadowingSession>(() =>
    createShadowingSession(buildShadowingChunks(lesson.cues, DEFAULT_CHUNK_SECONDS)),
  );
  const [speed, setSpeed] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [textVisible, setTextVisible] = useState(true);
  const [resumable, setResumable] = useState<ShadowingSessionRecord[]>([]);
  const [summaryDismissed, setSummaryDismissed] = useState(false);
  const recordIdRef = useRef(newRecordId());

  const videoId = useMemo(() => getYouTubeVideoId(sourceUrl), [sourceUrl]);
  const stats = useMemo(() => getSessionStats(session), [session]);
  const summary = useMemo(() => summarizeSession(session), [session]);
  const activeChunk = session.chunks.find(chunk => chunk.id === session.activeChunkId)!;
  const completed = stats.totalChunks > 0 && stats.attemptedChunks === stats.totalChunks;
  const showSummary = completed && !summaryDismissed;
  const showResumeBanner = resumable.length > 0 && stats.attemptedChunks === 0 && session.createdAt === session.updatedAt;

  useEffect(() => {
    let cancelled = false;
    storageService.getShadowingSessions().then(records => {
      if (cancelled) return;
      setResumable(records.filter(record => record.completedAt === null && isValidShadowingSessionRecord(record)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => {
    window.speechSynthesis?.cancel();
  }, []);

  const speak = useCallback((text: string, rate: number) => {
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = rate;
    window.speechSynthesis?.speak(utterance);
  }, []);

  const moveBy = useCallback((delta: number) => {
    setSession(current => {
      const index = current.chunks.findIndex(chunk => chunk.id === current.activeChunkId);
      const nextIndex = (index + delta + current.chunks.length) % current.chunks.length;
      return selectActiveChunk(current, current.chunks[nextIndex].id);
    });
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeed(current => cyclePlaybackSpeed(current));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const shortcut = mapShadowingShortcut(event, event.target as HTMLElement | null);
      if (!shortcut) return;
      event.preventDefault();
      if (shortcut === 'replay') {
        speak(activeChunk.text, speed);
      } else if (shortcut === 'previous') {
        moveBy(-1);
      } else if (shortcut === 'next') {
        moveBy(1);
      } else {
        cycleSpeed();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeChunk, speed, speak, moveBy, cycleSpeed]);

  const persist = (nextSession: ShadowingSession, completedNow: boolean) => {
    storageService.saveShadowingSession({
      id: recordIdRef.current,
      session: nextSession,
      sourceUrl,
      createdAt: nextSession.createdAt,
      updatedAt: nextSession.updatedAt,
      completedAt: completedNow ? new Date().toISOString() : null,
    });
  };

  const rate = (rating: ShadowingRating) => {
    const rated = rateChunk(session, activeChunk.id, rating);
    const nowCompleted = getSessionStats(rated).attemptedChunks === rated.chunks.length;
    // The session always has chunks here (the Video Lab validates the transcript),
    // so pickNextChunkId can safely be treated as non-null.
    const nextSession = autoAdvance && !nowCompleted
      ? selectActiveChunk(rated, pickNextChunkId(rated, activeChunk.id) as string)
      : rated;
    setSession(nextSession);
    persist(nextSession, nowCompleted);
  };

  const restartWithTarget = (seconds: number) => {
    setTargetSeconds(seconds);
    setSession(createShadowingSession(buildShadowingChunks(lesson.cues, seconds)));
    recordIdRef.current = newRecordId();
    setSummaryDismissed(false);
  };

  const resume = (record: ShadowingSessionRecord) => {
    recordIdRef.current = record.id;
    setSession(record.session);
    setSummaryDismissed(true);
  };

  const discard = async (record: ShadowingSessionRecord) => {
    await storageService.deleteShadowingSession(record.id);
    setResumable(current => current.filter(item => item.id !== record.id));
  };

  const openAtChunk = () => {
    window.open(
      `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(activeChunk.startSeconds)}s`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const ratingChoices: { rating: ShadowingRating; label: string; help: string; tone: string }[] = [
    { rating: 0, label: t('shadowing.rateAgain'), help: t('shadowing.rateAgainHelp'), tone: 'border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200' },
    { rating: 1, label: t('shadowing.rateHard'), help: t('shadowing.rateHardHelp'), tone: 'border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200' },
    { rating: 2, label: t('shadowing.rateGood'), help: t('shadowing.rateGoodHelp'), tone: 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200' },
    { rating: 3, label: t('shadowing.rateEasy'), help: t('shadowing.rateEasyHelp'), tone: 'border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200' },
  ];

  const chunkDurationSeconds = Math.max(1, Math.round(activeChunk.endSeconds - activeChunk.startSeconds));

  return (
    <div>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            {t('shadowing.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{t('shadowing.title')}</h1>
          <p className="text-indigo-100 text-base sm:text-lg leading-relaxed">{t('shadowing.subtitle')}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-indigo-100">
            {[t('shadowing.private'), t('shadowing.keyboard'), t('shadowing.sm2')].map(item => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1.5">✓ {item}</span>
            ))}
          </div>
        </div>
      </section>

      {showResumeBanner && (
        <section aria-label={t('shadowing.resumeTitle')} className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/40">
          <div>
            <h2 className="font-bold text-amber-950 dark:text-amber-100">{t('shadowing.resumeTitle')}</h2>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
              {t('shadowing.resumeHelp', {
                attempted: getSessionStats(resumable[0].session).attemptedChunks,
                total: getSessionStats(resumable[0].session).totalChunks,
                date: resumable[0].updatedAt.split('T')[0],
              })}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button label={t('shadowing.resume')} variant="primary" onClick={() => resume(resumable[0])} />
            <Button label={t('shadowing.discard')} variant="ghost" onClick={() => void discard(resumable[0])} />
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section aria-label={t('shadowing.studio')} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-5 flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="shadowing-chunk-length" className="block text-xs font-semibold text-slate-500 mb-1">{t('shadowing.chunkLength')}</label>
              <select
                id="shadowing-chunk-length"
                value={targetSeconds}
                onChange={event => restartWithTarget(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900"
              >
                {CHUNK_LENGTH_OPTIONS.map(option => (
                  <option key={option} value={option}>{t('shadowing.seconds', { seconds: option })}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="shadowing-speed" className="block text-xs font-semibold text-slate-500 mb-1">{t('shadowing.speed')}</label>
              <select
                id="shadowing-speed"
                value={speed}
                onChange={event => setSpeed(Number(event.target.value))}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900"
              >
                {SHADOWING_SPEEDS.map(option => (
                  <option key={option} value={option}>{option}×</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              aria-pressed={autoAdvance}
              onClick={() => setAutoAdvance(current => !current)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${autoAdvance
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                : 'border-slate-300 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-800'}`}
            >
              {t('shadowing.autoAdvance')}: {autoAdvance ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              aria-pressed={!textVisible}
              onClick={() => setTextVisible(current => !current)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {textVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {textVisible ? t('shadowing.hideTranscript') : t('shadowing.showTranscript')}
            </button>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t('shadowing.chunkOf', { current: activeChunk.index + 1, total: stats.totalChunks })}
            </p>
            <p className="text-xs font-medium text-slate-500">
              {formatTimestamp(activeChunk.startSeconds)} · {t('shadowing.seconds', { seconds: chunkDurationSeconds })} · {activeChunk.wordCount} {t('shadowing.words')}
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-5 sm:p-6 dark:border-indigo-900 dark:bg-indigo-950/30">
            {textVisible ? (
              <p className="text-lg sm:text-xl font-medium leading-relaxed text-slate-900 dark:text-slate-100">{activeChunk.text}</p>
            ) : (
              <p className="text-sm italic leading-relaxed text-indigo-700 dark:text-indigo-300">{t('shadowing.listenOnly')}</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button label={t('shadowing.playChunk')} variant="primary" onClick={() => speak(activeChunk.text, speed)} icon={<Play size={16} />} />
            <Button label={t('shadowing.replayChunk')} variant="secondary" onClick={() => speak(activeChunk.text, speed)} icon={<RotateCcw size={16} />} />
            <button
              type="button"
              onClick={() => moveBy(-1)}
              aria-label={t('shadowing.previousChunk')}
              className="rounded-lg border border-slate-300 p-2.5 text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-300"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => moveBy(1)}
              aria-label={t('shadowing.nextChunk')}
              className="rounded-lg border border-slate-300 p-2.5 text-slate-600 transition hover:border-indigo-400 hover:text-indigo-600 dark:border-slate-600 dark:text-slate-300"
            >
              <SkipForward className="h-4 w-4" />
            </button>
            <Button label={t('shadowing.newSession')} variant="ghost" onClick={onNewLesson} />
            {videoId && (
              <button
                type="button"
                onClick={openAtChunk}
                className="inline-flex items-center gap-1 px-2 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-300"
              >
                <ExternalLink className="h-3.5 w-3.5" /> {t('shadowing.openAt')}
              </button>
            )}
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{t('shadowing.ratePrompt')}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ratingChoices.map(choice => (
                <button
                  key={choice.rating}
                  type="button"
                  onClick={() => rate(choice.rating)}
                  className={`rounded-xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${choice.tone}`}
                >
                  <span className="block text-sm font-bold">{choice.label}</span>
                  <span className="mt-0.5 block text-[11px] font-medium opacity-80">{choice.help}</span>
                </button>
              ))}
            </div>
          </div>

          <details className="mt-6 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
              <span className="inline-flex items-center gap-1.5"><Mic className="h-4 w-4 text-indigo-600" /> {t('shadowing.recordTitle')}</span>
            </summary>
            <div className="mt-3">
              <VoiceRecorder />
            </div>
          </details>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <ProgressBar
              progress={stats.attemptedChunks}
              max={stats.totalChunks}
              label={t('shadowing.progress')}
              sublabel={`${stats.masteredChunks}/${stats.totalChunks} ${t('shadowing.masteredLabel')}`}
              color="purple"
            />
            <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300" role="status">
              {t('shadowing.dueCount', { count: stats.dueChunks })}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-white">{t('shadowing.studio')}</h2>
            <ol className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {session.chunks.map(chunk => {
                const progress = session.progress[chunk.id];
                const mastered = isChunkMastered(progress);
                const due = isChunkDue(progress);
                const statusKey = mastered ? 'statusMastered' : due ? 'statusDue' : 'statusScheduled';
                const dotClass = mastered
                  ? 'bg-emerald-500'
                  : due
                    ? 'bg-amber-500'
                    : 'bg-slate-300 dark:bg-slate-600';
                const isActive = chunk.id === activeChunk.id;
                return (
                  <li key={chunk.id}>
                    <button
                      type="button"
                      onClick={() => setSession(current => selectActiveChunk(current, chunk.id))}
                      aria-current={isActive ? 'true' : undefined}
                      aria-label={`${t('shadowing.jumpTo', { index: chunk.index + 1 })} — ${t(`shadowing.${statusKey}`)}`}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    >
                      <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                      <span className="font-mono text-slate-400">{formatTimestamp(chunk.startSeconds)}</span>
                      <span className="truncate">{t('shadowing.jumpTo', { index: chunk.index + 1 })}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
              <Keyboard className="h-4 w-4 text-indigo-600" /> {t('shadowing.shortcutsTitle')}
            </h2>
            <dl className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center justify-between gap-3"><dt><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-900">Space</kbd></dt><dd>{t('shadowing.shortcutReplay')}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-900">←</kbd></dt><dd>{t('shadowing.shortcutPrevious')}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-900">→</kbd></dt><dd>{t('shadowing.shortcutNext')}</dd></div>
              <div className="flex items-center justify-between gap-3"><dt><kbd className="rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono dark:border-slate-600 dark:bg-slate-900">R</kbd></dt><dd>{t('shadowing.shortcutSpeed')}</dd></div>
            </dl>
          </div>
        </aside>
      </div>

      {showSummary && (
        <section role="status" aria-label={t('shadowing.summaryTitle')} className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-7 dark:border-emerald-900 dark:bg-emerald-950/40">
          <h2 className="text-xl font-black text-emerald-950 dark:text-emerald-100">{t('shadowing.summaryTitle')}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [`${summary.attemptedChunks}/${summary.totalChunks}`, t('shadowing.summaryChunks')],
              [`${summary.masteredChunks}`, t('shadowing.summaryMastered')],
              [`${summary.averageRating.toFixed(1)} / 3`, t('shadowing.summaryRating')],
              [formatTimestamp(summary.elapsedSeconds), t('shadowing.summaryTime')],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-800 dark:bg-slate-800">
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">{value}</div>
                <div className="mt-1 text-xs text-slate-500">{label}</div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button label={t('shadowing.continue')} variant="primary" onClick={() => setSummaryDismissed(true)} />
            <Button label={t('shadowing.newSession')} variant="ghost" onClick={onNewLesson} />
          </div>
        </section>
      )}

      <p className="mt-6 text-xs text-slate-400">{language === 'vi' ? t('shadowing.methodVi') : t('shadowing.methodEn')}</p>
    </div>
  );
};
