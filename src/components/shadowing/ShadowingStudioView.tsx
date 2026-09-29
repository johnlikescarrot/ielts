import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  Gauge,
  Mic,
  MicVocal,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { useI18n } from '../../i18n/i18nContext';
import {
  buildShadowChunks,
  chunkProgress,
  CHUNK_BOUNDARY_EPSILON,
  clampChunkSeconds,
  countWords,
  cycleSpeed,
  ShadowChunk,
  summarizeChunks,
} from '../../shadowing/shadowingSession';
import {
  createShadowState,
  DEFAULT_SHADOW_CONFIG,
  ShadowConfig,
  shadowReducer,
} from '../../shadowing/shadowReducer';
import {
  MediaController,
} from '../../shadowing/mediaController';
import { LocalMediaController } from '../../shadowing/localMediaController';
import { SpeechController } from '../../shadowing/speechController';
import { buildYouTubeEmbedUrl, YouTubeEmbedController } from '../../shadowing/youtubeEmbedController';
import { buildShadowingAttempt, summarizeSession } from '../../shadowing/shadowingStats';
import { storageService } from '../../storage/storageService';
import { formatTimestamp, getYouTubeVideoId, parseTranscript } from '../../video/videoLesson';

const SAMPLE_TRANSCRIPT = `[00:00] Hello everyone, and welcome to today's discussion about remote work.
[00:08] More companies now realise that employees can be productive from anywhere.
[00:16] However, remote work also brings challenges, especially for young graduates.
[00:24] Without face-to-face contact, it is harder to build trust with colleagues.
[00:32] My advice is to communicate clearly and ask questions whenever you are unsure.
[00:40] Small daily habits, like a short morning call, keep the whole team connected.
[00:48] Over time, these habits create a culture of openness and mutual respect.
[00:56] So whether you work from home or from an office, communication remains the key.`;

export type ShadowMode = 'speech' | 'local' | 'youtube';

export interface ShadowTake {
  id: string;
  chunkId: string;
  chunkIndex: number;
  url: string;
  seconds: number;
}

const MODES: ShadowMode[] = ['speech', 'local', 'youtube'];
const PAUSE_OPTIONS = [0, 2, 3, 5, 10];
const REPEAT_OPTIONS = [1, 2, 3];
const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

interface ShadowPracticePanelProps {
  chunks: ShadowChunk[];
  config: ShadowConfig;
  mode: ShadowMode;
  mediaUrl: string;
  youtubeId: string;
  onExit: () => void;
}

const ShadowPracticePanel: React.FC<ShadowPracticePanelProps> = ({
  chunks,
  config,
  mode,
  mediaUrl,
  youtubeId,
  onExit,
}) => {
  const { t } = useI18n();
  const [state, dispatch] = useReducer(shadowReducer, config, initialConfig =>
    createShadowState(chunks, initialConfig)
  );
  const [rate, setRate] = useState(1);
  const [position, setPosition] = useState(chunks[0].startSeconds);
  const [waitRemaining, setWaitRemaining] = useState(config.pauseBetweenSeconds);
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [takes, setTakes] = useState<ShadowTake[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const controllerRef = useRef<MediaController | null>(null);
  const mediaRef = useRef<HTMLVideoElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const lastNonceRef = useRef(0);
  const awaitingSeekRef = useRef(false);
  const liveRef = useRef<{ chunk: ShadowChunk; phase: string }>({
    chunk: chunks[0],
    phase: 'ready',
  });
  const takesRef = useRef<ShadowTake[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const lastTakeAudioRef = useRef<HTMLAudioElement | null>(null);

  const chunk = state.chunks[state.index];
  const summary = useMemo(() => summarizeSession(state), [state]);
  const chunkSummary = useMemo(() => summarizeChunks(chunks), [chunks]);
  liveRef.current = { chunk, phase: state.phase };
  takesRef.current = takes;

  const handleTick = (seconds: number): void => {
    setPosition(seconds);
    const live = liveRef.current;
    if (live.phase !== 'playing') {
      return;
    }
    if (awaitingSeekRef.current) {
      if (seconds < live.chunk.endSeconds - 0.5) {
        awaitingSeekRef.current = false;
      } else {
        return;
      }
    }
    if (seconds >= live.chunk.endSeconds - CHUNK_BOUNDARY_EPSILON) {
      dispatch({ type: 'CHUNK_DONE' });
    }
  };

  // Attach the controller matching the selected mode.
  useEffect(() => {
    if (mode === 'local') {
      controllerRef.current = new LocalMediaController(mediaRef.current!);
    } else if (mode === 'youtube') {
      controllerRef.current = new YouTubeEmbedController(iframeRef.current!);
    } else {
      controllerRef.current = new SpeechController();
    }
    const controller = controllerRef.current;
    const offTick = controller.onTick(handleTick);
    const offEnded = controller.onEnded(() => dispatch({ type: 'CHUNK_DONE' }));
    return () => {
      offTick();
      offEnded();
      controller.destroy();
      controllerRef.current = null;
    };
  }, [mode]);

  // Perform the media command requested by the reducer.
  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller || state.command.nonce === lastNonceRef.current) {
      return;
    }
    lastNonceRef.current = state.command.nonce;
    if (state.command.action === 'play') {
      awaitingSeekRef.current = true;
      controller.playChunk(state.chunks[state.index], rate);
    } else if (state.command.action === 'pause') {
      controller.pause();
    }
  }, [state, rate]);

  // Push rate changes to the controller as they happen.
  useEffect(() => {
    controllerRef.current?.setRate(rate);
  }, [rate]);

  // Repetition-gap countdown while waiting between chunks.
  useEffect(() => {
    if (state.phase !== 'waiting') {
      return;
    }
    const total = state.config.pauseBetweenSeconds;
    const startedAt = Date.now();
    setWaitRemaining(total);
    const timer = setInterval(() => {
      const left = Math.max(0, total - (Date.now() - startedAt) / 1000);
      setWaitRemaining(left);
      if (left <= 0) {
        clearInterval(timer);
        dispatch({ type: 'WAIT_DONE' });
      }
    }, 250);
    return () => clearInterval(timer);
  }, [state.phase, state.index, state.config.pauseBetweenSeconds]);

  // Count active practice time (playing or repeating).
  useEffect(() => {
    if (state.phase !== 'playing' && state.phase !== 'waiting') {
      return;
    }
    const timer = setInterval(() => setPracticeSeconds(current => current + 1), 1000);
    return () => clearInterval(timer);
  }, [state.phase]);

  // Keyboard shortcuts, mirroring classic shadowing players.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (target && EDITABLE_TAGS.has(target.tagName)) {
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        dispatch({ type: 'REPLAY' });
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        dispatch({ type: 'NEXT' });
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        dispatch({ type: 'PREV' });
      } else if (event.key === 'r' || event.key === 'R') {
        setRate(current => cycleSpeed(current));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Release blob URLs for every recorded take when the session ends.
  useEffect(() => {
    return () => {
      takesRef.current.forEach(take => URL.revokeObjectURL(take.url));
    };
  }, []);

  const progress = chunkProgress(chunk, position);
  const playing = state.phase === 'playing';

  const startRecording = async (): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const parts: Blob[] = [];
    const startedAt = Date.now();
    recorder.ondataavailable = (event: BlobEvent): void => {
      parts.push(event.data);
    };
    recorder.onstop = (): void => {
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(parts, { type: recorder.mimeType || 'audio/webm' });
      const current = liveRef.current.chunk;
      setTakes(currentTakes => [
        ...currentTakes,
        {
          id: `take_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          chunkId: current.id,
          chunkIndex: current.index,
          url: URL.createObjectURL(blob),
          seconds: (Date.now() - startedAt) / 1000,
        },
      ]);
    };
    recorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = (): void => {
    recorderRef.current!.stop();
    recorderRef.current = null;
    setIsRecording(false);
  };

  const playTake = (url: string): void => {
    lastTakeAudioRef.current?.pause();
    const audio = document.createElement('audio');
    audio.src = url;
    lastTakeAudioRef.current = audio;
    void audio.play().catch(() => {
      // Take playback was blocked; downloading the take still works.
    });
  };

  const downloadTake = (take: ShadowTake): void => {
    const anchor = document.createElement('a');
    anchor.href = take.url;
    anchor.download = `${take.chunkId}_take.webm`;
    anchor.click();
  };

  const deleteTake = (take: ShadowTake): void => {
    URL.revokeObjectURL(take.url);
    setTakes(current => current.filter(item => item.id !== take.id));
  };

  const saveSession = async (): Promise<void> => {
    setSaveState('saving');
    await storageService.addTestAttempt(buildShadowingAttempt(state, practiceSeconds));
    setSaveState('saved');
  };

  const phaseLabel =
    state.phase === 'ready'
      ? t('shadow.phaseReady')
      : state.phase === 'playing'
        ? t('shadow.phasePlaying')
        : state.phase === 'waiting'
          ? t('shadow.phaseWaiting', { seconds: Math.ceil(waitRemaining) })
          : state.phase === 'finished'
            ? t('shadow.phaseFinished')
            : t('shadow.phasePaused');

  return (
    <section aria-label={t('shadow.practice')}>
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          [`${state.index + 1} ${t('shadow.of')} ${state.chunks.length}`, t('shadow.chunkLabel')],
          [`${state.completedChunks}/${state.chunks.length}`, t('shadow.chunksDone')],
          [String(state.totalReps), t('shadow.repsDone')],
          [formatTimestamp(practiceSeconds), t('shadow.timePracticed')],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            {mode === 'youtube' && (
              <iframe
                ref={iframeRef}
                title={t('shadow.practice')}
                src={buildYouTubeEmbedUrl(youtubeId)}
                className="mb-5 aspect-video w-full rounded-xl border border-slate-200 dark:border-slate-700"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
            {mode === 'local' && (
              <video
                ref={mediaRef}
                src={mediaUrl}
                className="mb-5 max-h-72 w-full rounded-xl bg-slate-900 dark:bg-slate-950"
              />
            )}
            {mode === 'speech' && (
              <div className="mb-5 flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200">
                <MicVocal className="h-5 w-5 shrink-0" />
                <span>{t('shadow.voiceNote')}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                {t('shadow.chunkLabel')} {state.index + 1} · {formatTimestamp(chunk.startSeconds)}–{formatTimestamp(chunk.endSeconds)}
              </span>
              <span
                role="status"
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  playing
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : state.phase === 'waiting'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {phaseLabel}
              </span>
            </div>

            <p className="mt-4 text-lg font-medium leading-8" data-testid="shadow-chunk-text">
              {chunk.text}
            </p>

            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700" role="progressbar">
              <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress * 100}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-xs font-mono text-slate-400">
              <span>{formatTimestamp(position)}</span>
              <span>{formatTimestamp(chunk.endSeconds)}</span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => dispatch({ type: 'PREV' })}
                aria-label={t('shadow.prevChunk')}
                className="rounded-lg border border-slate-200 p-2.5 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <Button
                label={playing ? t('shadow.pauseChunk') : t('shadow.playChunk')}
                variant="primary"
                icon={playing ? <Pause size={16} /> : <Play size={16} />}
                onClick={() => dispatch({ type: playing ? 'PAUSE' : 'PLAY' })}
              />
              <button
                type="button"
                onClick={() => dispatch({ type: 'REPLAY' })}
                aria-label={t('shadow.replayChunk')}
                title={t('shadow.replayChunk')}
                className="rounded-lg border border-slate-200 p-2.5 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'NEXT' })}
                aria-label={t('shadow.nextChunk')}
                className="rounded-lg border border-slate-200 p-2.5 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setRate(current => cycleSpeed(current))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-bold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
              >
                <Gauge className="h-4 w-4" />
                {t('shadow.speedButton', { rate: formatRate(rate) })}
              </button>
              {mode === 'youtube' && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${youtubeId}&t=${Math.floor(chunk.startSeconds)}s`,
                      '_blank',
                      'noopener,noreferrer'
                    )
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t('shadow.openChunkYouTube')}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <Mic className="h-4 w-4 text-rose-600" />
              {t('shadow.recordTake')}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{t('shadow.recordHelp')}</p>
            <div className="mt-3">
              {isRecording ? (
                <Button
                  label={t('shadow.stopRecording')}
                  variant="secondary"
                  icon={<Square size={16} />}
                  onClick={stopRecording}
                />
              ) : (
                <Button
                  label={t('shadow.record')}
                  variant="primary"
                  icon={<Mic size={16} />}
                  onClick={() => void startRecording()}
                />
              )}
            </div>

            <div className="mt-5 space-y-2">
              {takes.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500 dark:bg-slate-900">
                  {t('shadow.noTakes')}
                </p>
              ) : (
                takes.map(take => (
                  <div
                    key={take.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700"
                  >
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t('shadow.takeOfChunk', { index: take.chunkIndex + 1 })} · {formatTimestamp(take.seconds)}
                    </span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => playTake(take.url)}
                        aria-label={t('shadow.playTake')}
                        title={t('shadow.playTake')}
                        className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTake(take)}
                        aria-label={t('shadow.downloadTake')}
                        title={t('shadow.downloadTake')}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTake(take)}
                        aria-label={t('shadow.deleteTake')}
                        title={t('shadow.deleteTake')}
                        className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {saveState === 'saved' ? (
              <span role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
                {t('shadow.savedMessage')}
              </span>
            ) : (
              <Button
                label={saveState === 'saving' ? t('shadow.saving') : t('shadow.saveSession')}
                variant="secondary"
                onClick={() => void saveSession()}
              />
            )}
            <Button label={t('shadow.newSession')} variant="ghost" onClick={onExit} />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-sm font-bold">{t('shadow.summaryTitle')}</h3>
            <p className="mt-2 text-xs text-slate-500">
              {t('shadow.coverage', { percent: summary.coveragePercent })} · {summary.reps} {t('shadow.repsDone')} ·{' '}
              {chunkSummary.wordCount} {t('common.words')}
            </p>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(state.completedChunks / state.chunks.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-bold">{t('shadow.chunkList')}</h3>
            <ol className="max-h-96 space-y-1.5 overflow-y-auto pr-1">
              {state.chunks.map(item => {
                const isCurrent = item.index === state.index;
                const isDone = state.phase === 'finished' || item.index < state.index;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'GOTO', index: item.index })}
                      aria-current={isCurrent}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-xs leading-5 transition ${
                        isCurrent
                          ? 'border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950'
                          : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700 dark:hover:border-indigo-600'
                      }`}
                    >
                      <span className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                        <span>{formatTimestamp(item.startSeconds)}</span>
                        {isDone && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                      </span>
                      <span className="mt-1 block">{item.text}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100">{t('shadow.shortcuts')}</h3>
            <p className="mt-2 text-xs text-amber-900 dark:text-amber-200">{t('shadow.shortcutHelp')}</p>
          </div>
        </aside>
      </div>
    </section>
  );
};

function formatRate(rate: number): string {
  return Number.isInteger(rate) ? String(rate) : rate.toFixed(2).replace(/0$/, '');
}

type StudioStep = 'setup' | 'practice';

export const ShadowingStudioView: React.FC = () => {
  const { t } = useI18n();
  const [step, setStep] = useState<StudioStep>('setup');
  const [transcript, setTranscript] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [mode, setMode] = useState<ShadowMode>('speech');
  const [chunkSeconds, setChunkSeconds] = useState(10);
  const [autoAdvance, setAutoAdvance] = useState(DEFAULT_SHADOW_CONFIG.autoAdvance);
  const [pauseBetween, setPauseBetween] = useState(DEFAULT_SHADOW_CONFIG.pauseBetweenSeconds);
  const [repeats, setRepeats] = useState(DEFAULT_SHADOW_CONFIG.repeatEachChunk);
  const [localFile, setLocalFile] = useState<{ name: string; url: string } | null>(null);
  const [error, setError] = useState('');
  const [sessionKey, setSessionKey] = useState(0);
  const [chunks, setChunks] = useState<ShadowChunk[]>([]);
  const localFileRef = useRef<{ name: string; url: string } | null>(null);
  localFileRef.current = localFile;

  // Release the local media blob URL when the studio unmounts.
  useEffect(() => {
    return () => {
      if (localFileRef.current) {
        URL.revokeObjectURL(localFileRef.current.url);
      }
    };
  }, []);

  const onPickFile = (file: File | null): void => {
    if (localFile) {
      URL.revokeObjectURL(localFile.url);
    }
    if (!file) {
      setLocalFile(null);
      return;
    }
    setLocalFile({ name: file.name, url: URL.createObjectURL(file) });
  };

  const startSession = (): void => {
    const cues = parseTranscript(transcript);
    if (cues.length === 0 || countWords(transcript) < 10) {
      setError(t('shadow.errorTranscript'));
      return;
    }
    if (mode === 'youtube' && !getYouTubeVideoId(sourceUrl)) {
      setError(t('shadow.errorYouTube'));
      return;
    }
    if (mode === 'local' && !localFile) {
      setError(t('shadow.errorFile'));
      return;
    }
    setChunks(buildShadowChunks(cues, chunkSeconds));
    setSessionKey(current => current + 1);
    setError('');
    setStep('practice');
  };

  const exitSession = (): void => {
    setStep('setup');
    setChunks([]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-rose-950 to-indigo-900 p-6 sm:p-9 text-white shadow-xl mb-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {t('shadow.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{t('shadow.title')}</h1>
          <p className="text-indigo-100 text-base sm:text-lg leading-relaxed">{t('shadow.subtitle')}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-indigo-100">
            {[t('shadow.private'), t('shadow.noLogin'), t('shadow.shortcuts')].map(item => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1.5">✓ {item}</span>
            ))}
          </div>
        </div>
      </section>

      {step === 'setup' ? (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            aria-labelledby="shadow-source-heading"
          >
            <div className="flex items-start gap-3 mb-6">
              <div className="rounded-xl bg-rose-100 p-2.5 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                <MicVocal className="h-5 w-5" />
              </div>
              <div>
                <h2 id="shadow-source-heading" className="font-bold text-xl">
                  {t('shadow.sourceTitle')}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{t('shadow.sourceHelp')}</p>
              </div>
            </div>

            <fieldset className="mb-5">
              <legend className="mb-2 block text-sm font-semibold">{t('shadow.modeLabel')}</legend>
              <div className="grid sm:grid-cols-3 gap-2">
                {MODES.map(item => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={mode === item}
                    onClick={() => setMode(item)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      mode === item
                        ? 'border-rose-400 bg-rose-50 dark:border-rose-500 dark:bg-rose-950/60'
                        : 'border-slate-200 bg-white hover:border-rose-300 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <span className="block text-sm font-bold">{t(`shadow.mode_${item}`)}</span>
                    <span className="mt-1 block text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                      {t(`shadow.mode_${item}Help`)}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            {mode === 'youtube' && (
              <div className="mb-5">
                <label htmlFor="shadow-url" className="block text-sm font-semibold mb-2">
                  {t('shadow.urlLabel')}
                </label>
                <input
                  id="shadow-url"
                  value={sourceUrl}
                  onChange={event => setSourceUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-600 dark:bg-slate-900"
                />
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-300">{t('shadow.youtubePrivacy')}</p>
              </div>
            )}

            {mode === 'local' && (
              <div className="mb-5">
                <label htmlFor="shadow-file" className="block text-sm font-semibold mb-2">
                  {t('shadow.fileLabel')}
                </label>
                <input
                  id="shadow-file"
                  type="file"
                  accept="audio/*,video/*"
                  onChange={event => onPickFile(event.target.files![0])}
                  className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-rose-700 dark:file:bg-rose-950 dark:file:text-rose-200"
                />
                {localFile && (
                  <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                    {t('shadow.fileSelected', { name: localFile.name })}
                  </p>
                )}
              </div>
            )}

            <div className="mb-5">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="shadow-transcript" className="block text-sm font-semibold">
                  {t('shadow.transcriptLabel')}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTranscript(SAMPLE_TRANSCRIPT);
                    setError('');
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 dark:text-rose-300"
                >
                  {t('shadow.useSample')}
                </button>
              </div>
              <textarea
                id="shadow-transcript"
                value={transcript}
                onChange={event => {
                  setTranscript(event.target.value);
                  setError('');
                }}
                rows={10}
                placeholder={t('shadow.transcriptPlaceholder')}
                aria-describedby={error ? 'shadow-error' : 'shadow-format-help'}
                className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-6 outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-slate-600 dark:bg-slate-900"
              />
              <p id="shadow-format-help" className="mt-2 text-xs text-slate-500">
                {t('shadow.formatHelp')}
              </p>
              {error && (
                <p id="shadow-error" role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-200">
                  {error}
                </p>
              )}
            </div>

            <div className="mb-5 grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="shadow-chunk-length" className="block text-sm font-semibold mb-2">
                  {t('shadow.chunkLength')}
                </label>
                <input
                  id="shadow-chunk-length"
                  type="range"
                  min={3}
                  max={120}
                  step={1}
                  value={chunkSeconds}
                  onChange={event => setChunkSeconds(clampChunkSeconds(Number(event.target.value)))}
                  className="w-full accent-rose-600"
                />
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {t('shadow.chunkLengthValue', { seconds: chunkSeconds })}
                </p>
              </div>
              <div>
                <label htmlFor="shadow-repeats" className="block text-sm font-semibold mb-2">
                  {t('shadow.repeats')}
                </label>
                <select
                  id="shadow-repeats"
                  value={repeats}
                  onChange={event => setRepeats(Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  {REPEAT_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}×
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{t('shadow.repeatsHelp')}</p>
              </div>
            </div>

            <div className="mb-6 grid sm:grid-cols-2 gap-5">
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={event => setAutoAdvance(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-rose-600"
                />
                <span>
                  <span className="block text-sm font-semibold">{t('shadow.autoAdvance')}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">{t('shadow.autoAdvanceHelp')}</span>
                </span>
              </label>
              <div>
                <label htmlFor="shadow-pause" className="block text-sm font-semibold mb-2">
                  {t('shadow.pauseBetween')}
                </label>
                <select
                  id="shadow-pause"
                  value={pauseBetween}
                  onChange={event => setPauseBetween(Number(event.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-900"
                >
                  {PAUSE_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option === 0 ? t('shadow.noGap') : `${option}s`}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">{t('shadow.pauseBetweenHelp')}</p>
              </div>
            </div>

            <Button label={t('shadow.start')} variant="primary" size="lg" icon={<Play size={18} />} onClick={startSession} />
          </section>

          <aside className="space-y-4" aria-label={t('shadow.howItWorks')}>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
              <MicVocal className="h-6 w-6 text-emerald-600 mb-3" />
              <h2 className="font-bold text-emerald-950 dark:text-emerald-100">{t('shadow.howItWorks')}</h2>
              <ol className="mt-3 space-y-3 text-sm text-emerald-900 dark:text-emerald-200">
                <li>
                  <strong>1.</strong> {t('shadow.guide1')}
                </li>
                <li>
                  <strong>2.</strong> {t('shadow.guide2')}
                </li>
                <li>
                  <strong>3.</strong> {t('shadow.guide3')}
                </li>
              </ol>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
              <h3 className="font-bold text-amber-950 dark:text-amber-100">{t('shadow.shortcuts')}</h3>
              <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">{t('shadow.shortcutHelp')}</p>
            </div>
          </aside>
        </div>
      ) : (
        <ShadowPracticePanel
          key={sessionKey}
          chunks={chunks}
          config={{ autoAdvance, pauseBetweenSeconds: pauseBetween, repeatEachChunk: repeats }}
          mode={mode}
          mediaUrl={localFile ? localFile.url : ''}
          youtubeId={getYouTubeVideoId(sourceUrl) ?? ''}
          onExit={exitSession}
        />
      )}
    </div>
  );
};
