import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ExternalLink,
  Keyboard,
  Lightbulb,
  Repeat,
  RotateCcw,
  Sparkles,
  Upload,
  Volume2,
} from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { useI18n } from '../../i18n/i18nContext';
import {
  formatTimestamp,
  getYouTubeVideoId,
  MAX_TRANSCRIPT_CHARACTERS,
  parseTranscript,
} from '../../video/videoLesson';
import {
  buildShadowChunks,
  clampChunkSeconds,
  DEFAULT_CHUNK_SECONDS,
  effectiveEndSeconds,
  nextPlaybackRate,
  ShadowChunk,
} from '../../shadowing/chunker';
import {
  createSessionState,
  markChunkCompleted,
  recordReplay,
  sessionToAttempt,
  ShadowingSessionState,
  summarizeSession,
} from '../../shadowing/shadowingSession';
import { LocalMediaEngine, SpeechEngine } from '../../shadowing/mediaEngine';
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl } from '../../shadowing/youTubeEmbed';
import { storageService } from '../../storage/storageService';

const SAMPLE_CAPTIONS = `1
00:00:00,000 --> 00:00:05,500
Good morning. Today's lecture examines renewable energy adoption across Europe.

2
00:00:06,000 --> 00:00:11,500
Researchers estimate that solar capacity has doubled within the past decade.

3
00:00:12,000 --> 00:00:17,500
However, governments must allocate significant resources to upgrade the grid.

4
00:00:18,000 --> 00:00:23,500
One innovative approach integrates offshore wind with hydrogen storage.

5
00:00:24,000 --> 00:00:29,500
Critics argue that subsidy schemes distort competition between technologies.

6
00:00:30,000 --> 00:00:35,500
Nevertheless, communities increasingly support the transition to clean power.

7
00:00:36,000 --> 00:00:41,500
Effective policy therefore requires cooperation, investment, and assessment.

8
00:00:42,000 --> 00:00:47,500
Next week we will analyse case studies from Denmark and Portugal.`;

type StudioStep = 'source' | 'practice' | 'review';
type MediaMode = 'speech' | 'youtube' | 'local';

const MEDIA_MODES: MediaMode[] = ['speech', 'youtube', 'local'];

/** Embed URL for the chunk at `currentIndex`; the final chunk plays to the video's natural end. */
function embedSource(videoId: string, chunks: ShadowChunk[], currentIndex: number): string {
  const chunk = chunks[currentIndex];
  const endSeconds = currentIndex === chunks.length - 1 ? null : chunk.endSeconds;
  return buildYouTubeEmbedUrl(videoId, chunk.startSeconds, endSeconds);
}

export const ShadowingStudioView: React.FC = () => {
  const { language, t } = useI18n();
  const [step, setStep] = useState<StudioStep>('source');
  const [transcript, setTranscript] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [chunkSeconds, setChunkSeconds] = useState(DEFAULT_CHUNK_SECONDS);
  const [mediaMode, setMediaMode] = useState<MediaMode>('speech');
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);
  const [chunks, setChunks] = useState<ShadowChunk[] | null>(null);
  const [session, setSession] = useState<ShadowingSessionState | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [hideScript, setHideScript] = useState(false);
  const [revealedFor, setRevealedFor] = useState<number | null>(null);
  const [embedNonce, setEmbedNonce] = useState(0);
  const [error, setError] = useState('');
  const [mediaDuration, setMediaDuration] = useState<number | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);

  const mediaElementRef = useRef<HTMLMediaElement | null>(null);
  const setMediaElement = (element: HTMLMediaElement | null): void => {
    mediaElementRef.current = element;
  };
  const localEngineRef = useRef<LocalMediaEngine | null>(null);
  const speechEngineRef = useRef<SpeechEngine | null>(null);
  const chunkCompleteRef = useRef<((chunk: ShadowChunk) => void) | null>(null);

  /** Latest values for stable engine callbacks and keyboard shortcuts. */
  const latest = useRef({
    chunks,
    session,
    playbackRate,
    mediaDuration,
    autoAdvance,
    mediaMode,
  });
  useEffect(() => {
    latest.current = { chunks, session, playbackRate, mediaDuration, autoAdvance, mediaMode };
  });

  const videoId = useMemo(() => getYouTubeVideoId(sourceUrl), [sourceUrl]);

  /**
   * Plays the chunk at `index` with the active playback engine. Every caller is
   * rendered behind the `chunks && session` practice gate, so both are present;
   * the pure session helpers additionally tolerate null during async races.
   */
  const playChunkByIndex = useCallback((index: number) => {
    const state = latest.current;
    const activeChunks = state.chunks!;
    const target = Math.max(0, Math.min(index, activeChunks.length - 1));
    const chunk = activeChunks[target];
    setSession(current => recordReplay(current, target));
    if (state.mediaMode === 'local') {
      localEngineRef.current?.playChunk(chunk, state.playbackRate, state.mediaDuration);
    } else if (state.mediaMode === 'speech') {
      if (!speechEngineRef.current) {
        speechEngineRef.current = new SpeechEngine({
          onChunkComplete: completed => chunkCompleteRef.current?.(completed),
        });
      }
      speechEngineRef.current.setRate(state.playbackRate);
      speechEngineRef.current.playChunk(chunk);
    } else {
      setEmbedNonce(value => value + 1);
    }
  }, []);

  const handleChunkComplete = useCallback(
    (chunk: ShadowChunk) => {
      const state = latest.current;
      setSession(current => markChunkCompleted(current, chunk.index));
      if (state.autoAdvance && chunk.index < state.chunks!.length - 1) {
        playChunkByIndex(chunk.index + 1);
      }
    },
    [playChunkByIndex],
  );

  useEffect(() => {
    chunkCompleteRef.current = handleChunkComplete;
  });

  useEffect(() => {
    if (step !== 'practice' || mediaMode !== 'local' || !mediaElementRef.current) return undefined;
    const engine = new LocalMediaEngine(mediaElementRef.current, {
      onChunkComplete: completed => chunkCompleteRef.current?.(completed),
    });
    localEngineRef.current = engine;
    return () => {
      engine.dispose();
      localEngineRef.current = null;
    };
  }, [step, mediaMode]);

  useEffect(
    () => () => {
      speechEngineRef.current?.dispose();
      speechEngineRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!localObjectUrl) return undefined;
    return () => URL.revokeObjectURL(localObjectUrl);
  }, [localObjectUrl]);

  const acceptLocalFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setError(t('shadow.errorFileType'));
      return;
    }
    setLocalFile(file);
    setLocalObjectUrl(URL.createObjectURL(file));
    setError('');
  };

  const generate = () => {
    const cues = parseTranscript(transcript);
    const nextChunks = buildShadowChunks(cues, chunkSeconds);
    const wordCount = nextChunks.reduce((sum, chunk) => sum + chunk.wordCount, 0);
    if (wordCount < 20) {
      setError(t('shadow.errorTranscript'));
      return;
    }
    if (mediaMode === 'youtube' && !videoId) {
      setError(t('shadow.errorYouTube'));
      return;
    }
    if (mediaMode === 'local' && !localFile) {
      setError(t('shadow.errorLocalFile'));
      return;
    }
    setChunks(nextChunks);
    setSession(createSessionState(nextChunks.length, chunkSeconds));
    setMediaDuration(null);
    setSessionSaved(false);
    setRevealedFor(null);
    setError('');
    setStep('practice');
  };

  const replayChunk = useCallback(() => {
    playChunkByIndex(latest.current.session!.currentIndex);
  }, [playChunkByIndex]);

  const markCurrentCompletedIfPlayed = () => {
    const activeSession = latest.current.session!;
    if (activeSession.replays[activeSession.currentIndex] === 0) return;
    setSession(current => markChunkCompleted(current, activeSession.currentIndex));
  };

  const goToPrevious = useCallback(() => {
    const activeSession = latest.current.session!;
    if (activeSession.currentIndex <= 0) return;
    markCurrentCompletedIfPlayed();
    playChunkByIndex(activeSession.currentIndex - 1);
  }, [playChunkByIndex]);

  const goToNext = useCallback(() => {
    const state = latest.current;
    const activeSession = state.session!;
    const activeChunks = state.chunks!;
    markCurrentCompletedIfPlayed();
    if (activeSession.currentIndex < activeChunks.length - 1) {
      playChunkByIndex(activeSession.currentIndex + 1);
    }
  }, [playChunkByIndex]);

  const cycleRate = useCallback(() => {
    const next = nextPlaybackRate(latest.current.playbackRate);
    setPlaybackRate(next);
    if (latest.current.mediaMode === 'local') localEngineRef.current?.setRate(next);
    if (latest.current.mediaMode === 'speech') speechEngineRef.current?.setRate(next);
  }, []);

  const finishSession = async () => {
    const state = latest.current;
    localEngineRef.current?.pause();
    speechEngineRef.current?.stop();
    await storageService.addTestAttempt(sessionToAttempt(state.session!, state.chunks!));
    setSessionSaved(true);
    setStep('review');
  };

  const resetSession = () => {
    localEngineRef.current?.pause();
    speechEngineRef.current?.stop();
    setChunks(null);
    setSession(null);
    setStep('source');
    setPlaybackRate(1);
    setAutoAdvance(false);
    setHideScript(false);
    setRevealedFor(null);
    setMediaDuration(null);
    setSessionSaved(false);
    setError('');
  };

  const resumePracticeAt = (index: number) => {
    setStep('practice');
    playChunkByIndex(index);
  };

  useEffect(() => {
    if (step !== 'practice') return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      ) {
        return;
      }
      if (event.code === 'Space') {
        event.preventDefault();
        replayChunk();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        goToPrevious();
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        goToNext();
      } else if (event.code === 'KeyR') {
        event.preventDefault();
        cycleRate();
      } else if (event.code === 'KeyA') {
        event.preventDefault();
        setAutoAdvance(value => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [step, replayChunk, goToPrevious, goToNext, cycleRate]);

  const summary = useMemo(
    () => (session && chunks ? summarizeSession(session, chunks) : null),
    [session, chunks],
  );
  const transcriptWords = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const currentChunk = session && chunks ? chunks[session.currentIndex] : null;
  const scriptVisible = !hideScript || revealedFor === session?.currentIndex;

  const handleLoadedMetadata = (event: React.SyntheticEvent<HTMLMediaElement>): void => {
    const duration = event.currentTarget.duration;
    setMediaDuration(Number.isFinite(duration) && duration > 0 ? duration : null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 p-6 sm:p-9 text-white shadow-xl mb-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {t('shadow.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{t('shadow.title')}</h1>
          <p className="text-teal-100 text-base sm:text-lg leading-relaxed">{t('shadow.subtitle')}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-teal-100">
            {[t('shadow.private'), t('shadow.noSetup'), t('shadow.keyboardFirst')].map(item => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1.5">✓ {item}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-7 grid grid-cols-3 gap-2" role="tablist" aria-label={t('shadow.workflow')}>
        {(['source', 'practice', 'review'] as const).map((item, index) => {
          const active = step === item;
          const disabled = item !== 'source' && !chunks;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => setStep(item)}
              className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${active ? 'border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-200' : 'border-slate-200 bg-white text-slate-500 hover:border-teal-300 dark:border-slate-700 dark:bg-slate-800'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">{t('shadow.step')} {index + 1}</span>
              <span className="block text-sm font-bold mt-0.5">{t(`shadow.${item}`)}</span>
            </button>
          );
        })}
      </div>

      {step === 'source' && (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="shadow-source-heading">
            <div className="flex items-start gap-3 mb-6">
              <div className="rounded-xl bg-teal-100 p-2.5 text-teal-700 dark:bg-teal-950 dark:text-teal-300"><Repeat className="h-5 w-5" /></div>
              <div>
                <h2 id="shadow-source-heading" className="font-bold text-xl">{t('shadow.addSource')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('shadow.addSourceHelp')}</p>
              </div>
            </div>

            <div className="mb-5 flex items-center justify-between gap-3">
              <label htmlFor="shadow-transcript" className="block text-sm font-semibold">{t('shadow.transcriptLabel')}</label>
              <button type="button" onClick={() => { setTranscript(SAMPLE_CAPTIONS); setError(''); }} className="text-xs font-semibold text-teal-600 hover:text-teal-800 dark:text-teal-300">
                {t('shadow.useSample')}
              </button>
            </div>
            <textarea
              id="shadow-transcript"
              value={transcript}
              onChange={event => { setTranscript(event.target.value); setError(''); }}
              rows={10}
              maxLength={MAX_TRANSCRIPT_CHARACTERS}
              placeholder={t('shadow.transcriptPlaceholder')}
              aria-describedby="shadow-format-help"
              className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-6 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-600 dark:bg-slate-900"
            />
            <p id="shadow-format-help" className="mt-2 text-xs text-slate-500">{t('shadow.formatHelp')}</p>

            <div className="mt-5 grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="shadow-chunk-seconds" className="block text-sm font-semibold mb-2">{t('shadow.chunkSizeLabel')}</label>
                <input
                  id="shadow-chunk-seconds"
                  type="number"
                  min={3}
                  max={120}
                  value={chunkSeconds}
                  onChange={event => setChunkSeconds(Math.round(Number(event.target.value) || DEFAULT_CHUNK_SECONDS))}
                  onBlur={event => setChunkSeconds(clampChunkSeconds(Number(event.target.value)))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-600 dark:bg-slate-900"
                />
                <p className="mt-2 text-xs text-slate-500">{t('shadow.chunkSizeHelp')}</p>
              </div>
              <div>
                <span className="block text-sm font-semibold mb-2">{t('shadow.playbackSource')}</span>
                <div className="space-y-2">
                  {MEDIA_MODES.map(mode => (
                    <div key={mode} className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-700">
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                        <input
                          type="radio"
                          name="shadow-media-mode"
                          value={mode}
                          checked={mediaMode === mode}
                          onChange={() => setMediaMode(mode)}
                        />
                        {t(`shadow.source_${mode}`)}
                      </label>
                      <p className="mt-1 text-xs text-slate-500">{t(`shadow.source_${mode}_help`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {mediaMode === 'youtube' && (
              <div className="mt-5">
                <label htmlFor="shadow-youtube-url" className="block text-sm font-semibold mb-2">{t('shadow.youtubeUrlLabel')}</label>
                <input
                  id="shadow-youtube-url"
                  value={sourceUrl}
                  onChange={event => setSourceUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-200 dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
            )}

            {mediaMode === 'local' && (
              <div className="mt-5">
                <span className="block text-sm font-semibold mb-2">{t('shadow.localFileLabel')}</span>
                <div
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-slate-600 dark:bg-slate-900"
                  onDragOver={event => event.preventDefault()}
                  onDrop={event => {
                    event.preventDefault();
                    acceptLocalFile(event.dataTransfer.files[0] ?? null);
                  }}
                >
                  <Upload className="h-6 w-6 text-slate-400" aria-hidden="true" />
                  <p className="text-sm text-slate-500">{t('shadow.dropFile')}</p>
                  <label className="mt-1 cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700">
                    {t('shadow.browseFile')}
                    <input
                      type="file"
                      accept="audio/*,video/*"
                      className="hidden"
                      onChange={event => {
                        acceptLocalFile(event.target.files?.[0] ?? null);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {localFile && (
                    <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t('shadow.fileLoaded')} {localFile.name}</p>
                  )}
                </div>
              </div>
            )}

            {error && <p role="alert" className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button label={t('shadow.start')} variant="primary" size="lg" onClick={generate} icon={<Repeat size={18} />} />
              {transcript && <span className="text-xs text-slate-500">{transcriptWords} {t('common.words')}</span>}
            </div>
          </section>

          <aside className="space-y-4" aria-label={t('shadow.howItWorks')}>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
              <BookOpenCheck className="h-6 w-6 text-emerald-600 mb-3" />
              <h2 className="font-bold text-emerald-950 dark:text-emerald-100">{t('shadow.howItWorks')}</h2>
              <ol className="mt-3 space-y-3 text-sm text-emerald-900 dark:text-emerald-200">
                <li><strong>1.</strong> {t('shadow.guide1')}</li>
                <li><strong>2.</strong> {t('shadow.guide2')}</li>
                <li><strong>3.</strong> {t('shadow.guide3')}</li>
                <li><strong>4.</strong> {t('shadow.guide4')}</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 dark:border-teal-900 dark:bg-teal-950/40">
              <Keyboard className="h-5 w-5 text-teal-600 mb-2" />
              <h3 className="font-bold text-teal-950 dark:text-teal-100">{t('shadow.shortcuts')}</h3>
              <dl className="mt-3 space-y-2 text-sm text-teal-900 dark:text-teal-200">
                {[
                  ['Space', t('shadow.shortcutReplay')],
                  ['←', t('shadow.shortcutPrev')],
                  ['→', t('shadow.shortcutNext')],
                  ['R', t('shadow.shortcutRate')],
                  ['A', t('shadow.shortcutAuto')],
                ].map(([key, action]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <dt><kbd className="rounded border border-teal-300 bg-white px-2 py-0.5 font-mono text-xs dark:border-teal-800 dark:bg-slate-900">{key}</kbd></dt>
                    <dd>{action}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
              <Lightbulb className="h-5 w-5 text-amber-600 mb-2" />
              <h3 className="font-bold text-amber-950 dark:text-amber-100">{t('shadow.researchTipTitle')}</h3>
              <p className="text-sm text-amber-900 dark:text-amber-200 mt-2 leading-relaxed">{t('shadow.researchTipText')}</p>
            </div>
          </aside>
        </div>
      )}

      {step === 'practice' && chunks && session && summary && (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              [`${summary.completedChunks}/${summary.totalChunks}`, t('shadow.chunksCompleted')],
              [String(summary.replays), t('shadow.replays')],
              [String(summary.wordsShadowed), t('shadow.wordsShadowed')],
              [`${Math.max(1, Math.round(summary.activeSeconds / 60))} ${t('common.minutes')}`, t('shadow.activeTime')],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xl font-black text-teal-700 dark:text-teal-300">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="mb-6">
              {mediaMode === 'speech' && (
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-900" role="note">
                  <Volume2 className="mt-0.5 h-5 w-5 text-teal-600" />
                  <div>
                    <h2 className="font-bold">{t('shadow.pronunciationModel')}</h2>
                    <p className="mt-1 text-sm text-slate-500">{t('shadow.speechNote')}</p>
                  </div>
                </div>
              )}
              {mediaMode === 'youtube' && videoId && (
                <div>
                  <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                    <iframe
                      key={`${videoId}-${session.currentIndex}-${embedNonce}`}
                      src={embedSource(videoId, chunks, session.currentIndex)}
                      title={t('shadow.youTubePreview')}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 h-full w-full"
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{t('shadow.youTubeNote')}</p>
                </div>
              )}
              {mediaMode === 'local' && localObjectUrl && (
                <div>
                  {localFile?.type.startsWith('video/') ? (
                    <video
                      ref={setMediaElement}
                      src={localObjectUrl}
                      controls
                      onLoadedMetadata={handleLoadedMetadata}
                      className="w-full rounded-xl bg-black"
                    />
                  ) : (
                    <audio
                      ref={setMediaElement}
                      src={localObjectUrl}
                      controls
                      onLoadedMetadata={handleLoadedMetadata}
                      className="w-full"
                    />
                  )}
                </div>
              )}
            </div>

            {currentChunk && (
              <article className="rounded-xl border border-slate-200 p-5 dark:border-slate-700" aria-label={t('shadow.chunkOf', { current: session.currentIndex + 1, total: chunks.length })}>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-teal-100 px-3 py-1 font-bold text-teal-800 dark:bg-teal-950 dark:text-teal-200">
                      {t('shadow.chunkOf', { current: session.currentIndex + 1, total: chunks.length })}
                    </span>
                    <span className="font-mono text-slate-500">
                      {formatTimestamp(currentChunk.startSeconds)} – {formatTimestamp(effectiveEndSeconds(currentChunk, mediaDuration))}
                    </span>
                    <span className="text-slate-500">{currentChunk.wordCount} {t('common.words')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHideScript(value => !value)}
                    aria-pressed={hideScript}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    {hideScript ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {hideScript ? t('shadow.showScript') : t('shadow.hideScript')}
                  </button>
                </div>

                {scriptVisible ? (
                  <p className="text-lg sm:text-xl leading-loose font-medium">{currentChunk.text}</p>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-900">
                    <p className="text-sm text-slate-500">{t('shadow.scriptHidden')}</p>
                    <button
                      type="button"
                      onClick={() => setRevealedFor(session.currentIndex)}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700"
                    >
                      <Eye className="h-3.5 w-3.5" /> {t('shadow.peekScript')}
                    </button>
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button label={t('shadow.replay')} variant="primary" onClick={replayChunk} icon={<RotateCcw size={16} />} />
                  <button
                    type="button"
                    onClick={goToPrevious}
                    disabled={session.currentIndex <= 0}
                    aria-label={t('shadow.previousChunk')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label={t('shadow.nextChunk')}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={cycleRate}
                    aria-label={t('shadow.speed')}
                    className="rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm font-bold hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    ×{playbackRate}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoAdvance(value => !value)}
                    aria-pressed={autoAdvance}
                    disabled={mediaMode === 'youtube'}
                    title={mediaMode === 'youtube' ? t('shadow.youTubeNote') : undefined}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${autoAdvance ? 'bg-teal-600 text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {t('shadow.autoAdvance')}
                  </button>
                  {mediaMode === 'youtube' && videoId && (
                    <a
                      href={buildYouTubeWatchUrl(videoId, currentChunk.startSeconds)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> {t('shadow.openOnYouTube')}
                    </a>
                  )}
                </div>
              </article>
            )}

            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold text-slate-500">{t('shadow.chunkStrip')}</p>
              <div className="flex flex-wrap gap-1.5">
                {chunks.map((chunk, index) => {
                  const isCurrent = index === session.currentIndex;
                  const done = session.completedChunks[index];
                  return (
                    <button
                      key={chunk.index}
                      type="button"
                      onClick={() => playChunkByIndex(index)}
                      aria-label={t('shadow.jumpToChunk', { number: index + 1 })}
                      aria-current={isCurrent}
                      className={`h-8 w-8 rounded-lg text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 ${
                        isCurrent
                          ? 'bg-teal-600 text-white'
                          : done
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : session.replays[index] > 0
                              ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button label={t('shadow.finishSession')} variant="primary" onClick={finishSession} icon={<AudioLines size={16} />} />
              <Button label={t('shadow.newSession')} variant="ghost" onClick={resetSession} />
            </div>
          </div>
        </section>
      )}

      {step === 'review' && chunks && session && summary && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6">
            <h2 className="text-xl font-bold">{t('shadow.reviewTitle')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('shadow.reviewHelp')}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              [`${summary.completedChunks}/${summary.totalChunks}`, t('shadow.chunksCompleted')],
              [`${summary.coveragePercent}%`, t('shadow.coverage')],
              [String(summary.replays), t('shadow.replays')],
              [`${Math.max(1, Math.round(summary.activeSeconds / 60))} ${t('common.minutes')}`, t('shadow.activeTime')],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="text-xl font-black text-teal-700 dark:text-teal-300">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {sessionSaved && (
            <p role="status" className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
              {t('shadow.saved')}
            </p>
          )}

          {summary.allCompleted ? (
            <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200">{t('shadow.allDone')}</p>
          ) : (
            <div className="mb-6">
              <h3 className="font-bold mb-3">{t('shadow.revisit')}</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {chunks
                  .map((chunk, index) => ({ chunk, index }))
                  .filter(({ index }) => !session.completedChunks[index])
                  .map(({ chunk, index }) => (
                    <button
                      key={chunk.index}
                      type="button"
                      onClick={() => resumePracticeAt(index)}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left text-sm hover:border-amber-400 dark:border-amber-900 dark:bg-amber-950/40"
                    >
                      <span className="font-bold text-amber-900 dark:text-amber-200">{t('shadow.chunkOf', { current: index + 1, total: chunks.length })}</span>
                      <span className="mt-1 block text-slate-600 dark:text-slate-300">{chunk.text.slice(0, 120)}{chunk.text.length > 120 ? '…' : ''}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-bold mb-3">{t('shadow.breakdown')}</h3>
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {chunks.map((chunk, index) => (
                <li key={chunk.index} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{index + 1}. {chunk.text}</span>
                  <span className="shrink-0 font-mono text-xs text-slate-500">
                    {session.replays[index]}× {t('shadow.replays')}
                  </span>
                  <span className={`shrink-0 text-xs font-bold ${session.completedChunks[index] ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {session.completedChunks[index] ? `✓ ${t('shadow.shadowed')}` : t('shadow.pending')}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button label={t('shadow.practiceMore')} variant="primary" onClick={() => setStep('practice')} />
            <Button label={t('shadow.newSession')} variant="ghost" onClick={resetSession} />
          </div>
          <p className="mt-6 text-xs text-slate-400">{language === 'vi' ? t('shadow.methodVi') : t('shadow.methodEn')}</p>
        </section>
      )}
    </div>
  );
};
