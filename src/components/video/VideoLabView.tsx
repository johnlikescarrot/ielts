import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Headphones,
  Keyboard,
  Lightbulb,
  Play,
  Repeat2,
  RotateCcw,
  Sparkles,
  Video,
} from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { useI18n } from '../../i18n/i18nContext';
import {
  createVideoLesson,
  formatTimestamp,
  getYouTubeVideoId,
  MAX_TRANSCRIPT_CHARACTERS,
  scoreLesson,
  VideoLesson,
} from '../../video/videoLesson';
import {
  createShadowingChunks,
  getAdjacentChunkIndex,
  getShadowingProgress,
} from '../../video/shadowingSession';

const SAMPLE_TRANSCRIPT = `[00:00] Researchers analyze how cities can create sustainable transport systems.
[00:08] The evidence indicates that accessible public transit benefits entire communities.
[00:16] However, governments must allocate significant resources before infrastructure can improve.
[00:24] One innovative approach is to integrate cycling routes with railway stations.
[00:32] This policy could mitigate pollution while encouraging healthier daily routines.
[00:40] Citizens increasingly support environmental measures when the economic benefits are clear.
[00:48] In conclusion, effective urban planning requires cooperation, investment, and careful assessment.`;

type LabStep = 'source' | 'shadowing' | 'practice' | 'vocabulary';

const SHADOWING_SPEEDS = [0.7, 0.85, 1, 1.15, 1.3] as const;
const SHADOWING_REPEATS = [1, 3, 5] as const;
const CHUNK_LENGTHS = [3, 5, 8, 12, 20, 30, 60, 120] as const;

export const VideoLabView: React.FC = () => {
  const { language, t } = useI18n();
  const [sourceUrl, setSourceUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [step, setStep] = useState<LabStep>('source');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [chunkSeconds, setChunkSeconds] = useState(8);
  const [shadowIndex, setShadowIndex] = useState(0);
  const [shadowRate, setShadowRate] = useState(0.85);
  const [shadowRepeats, setShadowRepeats] = useState(3);
  const [completedRepeats, setCompletedRepeats] = useState(0);
  const [isShadowPlaying, setIsShadowPlaying] = useState(false);
  const [showShadowText, setShowShadowText] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);

  const videoId = useMemo(() => getYouTubeVideoId(sourceUrl), [sourceUrl]);
  const score = lesson ? scoreLesson(lesson.questions, answers) : 0;
  const shadowChunks = useMemo(
    () => createShadowingChunks(lesson?.cues ?? [], chunkSeconds),
    [lesson, chunkSeconds],
  );
  const currentShadowChunk = shadowChunks[shadowIndex];
  const shadowProgress = getShadowingProgress(shadowIndex, shadowChunks.length);

  const generate = () => {
    const nextLesson = createVideoLesson(transcript);
    if (nextLesson.wordCount < 20 || nextLesson.questions.length === 0) {
      setError(t('video.errorTranscript'));
      return;
    }
    setLesson(nextLesson);
    setAnswers({});
    setSubmitted(false);
    setShowHints({});
    setError('');
    setShadowIndex(0);
    setCompletedRepeats(0);
    setShowShadowText(false);
    setStep('shadowing');
  };

  const speakCue = (text: string) => {
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9;
    window.speechSynthesis?.speak(utterance);
  };

  const stopShadowing = () => {
    window.speechSynthesis?.cancel();
    setIsShadowPlaying(false);
  };

  const moveShadow = (direction: -1 | 1) => {
    stopShadowing();
    setCompletedRepeats(0);
    setShadowIndex(current => getAdjacentChunkIndex(current, shadowChunks.length, direction));
  };

  const playShadowChunk = () => {
    const chunk = currentShadowChunk!;
    stopShadowing();
    setCompletedRepeats(0);
    setIsShadowPlaying(true);
    const playingIndex = shadowIndex;

    const playIteration = (iteration: number) => {
      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utterance.lang = 'en-GB';
      utterance.rate = shadowRate;
      utterance.onend = () => {
        setCompletedRepeats(iteration);
        if (iteration < shadowRepeats) {
          playIteration(iteration + 1);
          return;
        }
        setIsShadowPlaying(false);
        if (autoAdvance) {
          setShadowIndex(getAdjacentChunkIndex(playingIndex, shadowChunks.length, 1));
        }
      };
      window.speechSynthesis?.speak(utterance);
    };

    playIteration(1);
  };

  useEffect(() => {
    if (step !== 'shadowing') return undefined;
    const handleShortcut = (event: KeyboardEvent) => {
      const tagName = (event.target as HTMLElement | null)?.tagName;
      if (tagName === 'INPUT' || tagName === 'SELECT' || tagName === 'TEXTAREA') return;
      if (event.key === 'ArrowLeft') moveShadow(-1);
      if (event.key === 'ArrowRight') moveShadow(1);
      if (event.key === ' ') {
        event.preventDefault();
        playShadowChunk();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  });

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const reset = () => {
    stopShadowing();
    setLesson(null);
    setAnswers({});
    setSubmitted(false);
    setShadowIndex(0);
    setCompletedRepeats(0);
    setStep('source');
  };

  const openAt = (seconds: number) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(seconds)}s`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 p-6 sm:p-9 text-white shadow-xl mb-7">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold mb-4">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            {t('video.badge')}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">{t('video.title')}</h1>
          <p className="text-indigo-100 text-base sm:text-lg leading-relaxed">{t('video.subtitle')}</p>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-indigo-100">
            {[t('video.private'), t('video.noAi'), t('video.captionFormats')].map(item => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1.5">✓ {item}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-7 grid grid-cols-2 gap-2 sm:grid-cols-4" role="tablist" aria-label={t('video.workflow')}>
        {(['source', 'shadowing', 'practice', 'vocabulary'] as const).map((item, index) => {
          const active = step === item;
          const disabled = item !== 'source' && !lesson;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => {
                if (step === 'shadowing' && item !== 'shadowing') stopShadowing();
                setStep(item);
              }}
              className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${active ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200' : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800'} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">{t('video.step')} {index + 1}</span>
              <span className="block text-sm font-bold mt-0.5">{t(`video.${item}`)}</span>
            </button>
          );
        })}
      </div>

      {step === 'source' && (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="video-source-heading">
            <div className="flex items-start gap-3 mb-6">
              <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"><Video className="h-5 w-5" /></div>
              <div>
                <h2 id="video-source-heading" className="font-bold text-xl">{t('video.addSource')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('video.addSourceHelp')}</p>
              </div>
            </div>

            <label htmlFor="video-url" className="block text-sm font-semibold mb-2">{t('video.urlLabel')} <span className="font-normal text-slate-400">({t('video.optional')})</span></label>
            <input
              id="video-url"
              value={sourceUrl}
              onChange={event => setSourceUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900"
            />

            <div className="mt-5 flex items-center justify-between gap-3">
              <label htmlFor="video-transcript" className="block text-sm font-semibold">{t('video.transcriptLabel')}</label>
              <button type="button" onClick={() => { setTranscript(SAMPLE_TRANSCRIPT); setError(''); }} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300">
                {t('video.useSample')}
              </button>
            </div>
            <textarea
              id="video-transcript"
              value={transcript}
              onChange={event => { setTranscript(event.target.value); setError(''); }}
              rows={12}
              maxLength={MAX_TRANSCRIPT_CHARACTERS}
              placeholder={t('video.transcriptPlaceholder')}
              aria-describedby={error ? 'video-error' : 'video-format-help'}
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900"
            />
            <p id="video-format-help" className="mt-2 text-xs text-slate-500">{t('video.formatHelp')}</p>
            {error && <p id="video-error" role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}

            <label htmlFor="shadow-chunk-length" className="mt-5 block text-sm font-semibold">{t('video.chunkLength')}</label>
            <select
              id="shadow-chunk-length"
              value={chunkSeconds}
              onChange={event => setChunkSeconds(Number(event.target.value))}
              className="mt-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
            >
              {CHUNK_LENGTHS.map(seconds => <option key={seconds} value={seconds}>{seconds} {t('video.seconds')}</option>)}
            </select>
            <p className="mt-2 text-xs text-slate-500">{t('video.chunkLengthHelp')}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button label={t('video.generate')} variant="primary" size="lg" onClick={generate} icon={<Sparkles size={18} />} />
              {transcript && <span className="text-xs text-slate-500">{transcript.trim().split(/\s+/).length} {t('common.words')}</span>}
            </div>
          </section>

          <aside className="space-y-4" aria-label={t('video.howItWorks')}>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
              <BookOpenCheck className="h-6 w-6 text-emerald-600 mb-3" />
              <h2 className="font-bold text-emerald-950 dark:text-emerald-100">{t('video.howItWorks')}</h2>
              <ol className="mt-3 space-y-3 text-sm text-emerald-900 dark:text-emerald-200">
                <li><strong>1.</strong> {t('video.guide1')}</li>
                <li><strong>2.</strong> {t('video.guide2')}</li>
                <li><strong>3.</strong> {t('video.guide3')}</li>
              </ol>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
              <Lightbulb className="h-5 w-5 text-amber-600 mb-2" />
              <h3 className="font-bold text-amber-950 dark:text-amber-100">{t('video.captionTip')}</h3>
              <p className="text-sm text-amber-900 dark:text-amber-200 mt-2 leading-relaxed">{t('video.captionTipText')}</p>
            </div>
          </aside>
        </div>
      )}

      {step === 'shadowing' && lesson && currentShadowChunk && (
        <section aria-labelledby="shadowing-heading" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-7">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <section>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">{t('video.shadowingEyebrow')}</p>
              <h2 id="shadowing-heading" className="mt-1 text-2xl font-black">{t('video.shadowingTitle')}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{t('video.shadowingHelp')}</p>
            </section>
            <p role="status" aria-live="polite" className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
              {shadowProgress.current} / {shadowProgress.total}
            </p>
          </header>

          <section className="mt-6" aria-label={t('video.shadowingProgress')}>
            <ProgressBar
              label={t('video.shadowingProgress')}
              value={shadowProgress.current}
              max={shadowProgress.total}
              hasValueLabel
              formatValueLabel={(value, max) => `${value}/${max}`}
              variant={shadowProgress.percent === 100 ? 'success' : 'accent'}
            />
          </section>

          <article className="mt-6 rounded-2xl bg-slate-950 p-5 text-white sm:p-8">
            <header className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
              <p className="font-mono">{formatTimestamp(currentShadowChunk.startSeconds)} → {formatTimestamp(currentShadowChunk.endSeconds)} · {currentShadowChunk.durationSeconds}s</p>
              <p>{t('video.repeatProgress')}: {completedRepeats}/{shadowRepeats}</p>
            </header>
            {showShadowText ? (
              <p className="mt-7 text-xl font-semibold leading-9 sm:text-2xl">{currentShadowChunk.text}</p>
            ) : (
              <p className="mt-7 rounded-xl border border-dashed border-slate-600 p-6 text-center text-slate-400">{t('video.transcriptHidden')}</p>
            )}
            <nav className="mt-7 flex flex-wrap items-center justify-center gap-3" aria-label={t('video.shadowControls')}>
              <button
                type="button"
                onClick={() => moveShadow(-1)}
                disabled={shadowIndex === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 font-semibold disabled:opacity-40"
                aria-label={t('video.previousChunk')}
              >
                <ChevronLeft className="h-5 w-5" /> {t('common.previous')}
              </button>
              <button
                type="button"
                onClick={playShadowChunk}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 font-black text-white hover:bg-indigo-400"
                aria-label={t('video.replayChunk')}
              >
                {isShadowPlaying ? <Repeat2 className="h-5 w-5 animate-pulse" /> : <Play className="h-5 w-5" />}
                {isShadowPlaying ? t('video.repeating') : t('video.playAndRepeat')}
              </button>
              <button
                type="button"
                onClick={() => moveShadow(1)}
                disabled={shadowIndex === shadowChunks.length - 1}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-3 font-semibold disabled:opacity-40"
                aria-label={t('video.nextChunk')}
              >
                {t('common.next')} <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </article>

          <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label={t('video.shadowSettings')}>
            <label className="text-sm font-semibold">
              {t('common.audioSpeed')}
              <select
                aria-label={t('common.audioSpeed')}
                value={shadowRate}
                onChange={event => setShadowRate(Number(event.target.value))}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              >
                {SHADOWING_SPEEDS.map(speed => <option key={speed} value={speed}>{speed}×</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {t('video.repetitions')}
              <select
                aria-label={t('video.repetitions')}
                value={shadowRepeats}
                onChange={event => setShadowRepeats(Number(event.target.value))}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-900"
              >
                {SHADOWING_REPEATS.map(repeats => <option key={repeats} value={repeats}>{repeats}×</option>)}
              </select>
            </label>
            <section className="flex flex-col justify-end gap-2 text-sm font-semibold">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={autoAdvance} onChange={event => setAutoAdvance(event.target.checked)} />
                {t('video.autoAdvance')}
              </label>
              <button type="button" onClick={() => setShowShadowText(current => !current)} className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-300">
                {showShadowText ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showShadowText ? t('video.hideTranscript') : t('video.revealTranscript')}
              </button>
            </section>
          </section>

          <aside className="mt-6 flex items-start gap-3 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100">
            <Keyboard className="mt-0.5 h-5 w-5 shrink-0" />
            <p><strong>{t('video.keyboardTitle')}:</strong> {t('video.keyboardHelp')}</p>
          </aside>

          <footer className="mt-6 flex flex-wrap gap-3">
            <Button label={t('video.continueChallenge')} variant="primary" onClick={() => { stopShadowing(); setStep('practice'); }} />
            {videoId && <Button label={t('video.openVideo')} variant="secondary" icon={<ExternalLink size={16} />} onClick={() => openAt(currentShadowChunk.startSeconds)} />}
            <Button label={t('video.newLesson')} variant="ghost" onClick={reset} />
          </footer>
        </section>
      )}

      {step === 'practice' && lesson && (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              [lesson.wordCount, t('video.transcriptWords')],
              [lesson.cues.length, t('video.captionCues')],
              [lesson.questions.length, t('common.questions')],
              [formatTimestamp(lesson.durationSeconds), t('video.lastTimestamp')],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><Headphones className="h-5 w-5 text-indigo-600" />{t('video.listeningChallenge')}</h2>
                <p className="text-sm text-slate-500 mt-1">{t('video.challengeHelp')}</p>
              </div>
              {submitted && (
                <div role="status" className="rounded-xl bg-indigo-100 px-4 py-2 font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">
                  {score}/{lesson.questions.length} · {Math.round((score / lesson.questions.length) * 100)}%
                </div>
              )}
            </div>

            <div className="space-y-4">
              {lesson.questions.map((question, index) => {
                const isCorrect = submitted && scoreLesson([question], answers) === 1;
                return (
                  <article key={question.id} className={`rounded-xl border p-4 sm:p-5 ${submitted ? (isCorrect ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30' : 'border-rose-300 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30') : 'border-slate-200 dark:border-slate-700'}`}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{index + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => speakCue(question.cueText)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-indigo-900" aria-label={`${t('video.playCue')} ${index + 1}`}>
                            <Play className="h-3.5 w-3.5" /> {formatTimestamp(question.startSeconds)}
                          </button>
                          {videoId && <button type="button" onClick={() => openAt(question.startSeconds)} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300"><ExternalLink className="h-3.5 w-3.5" />{t('video.openVideo')}</button>}
                        </div>
                        <p className="font-medium leading-7">{question.prompt}</p>
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <input
                            aria-label={`${t('video.answer')} ${index + 1}`}
                            value={answers[question.id] ?? ''}
                            onChange={event => setAnswers(current => ({ ...current, [question.id]: event.target.value }))}
                            disabled={submitted}
                            autoComplete="off"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900"
                            placeholder={t('video.typeAnswer')}
                          />
                          {!submitted && <button type="button" onClick={() => setShowHints(current => ({ ...current, [question.id]: !current[question.id] }))} className="rounded-lg px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950">{showHints[question.id] ? question.hint : t('video.showHint')}</button>}
                        </div>
                        {submitted && <p className={`mt-2 text-sm font-semibold ${isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>{isCorrect ? `✓ ${t('common.correct')}` : `✗ ${t('video.correctAnswer')}: ${question.answer}`}</p>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!submitted ? (
                <Button label={t('video.checkAnswers')} variant="primary" onClick={() => setSubmitted(true)} isDisabled={Object.keys(answers).length === 0} />
              ) : (
                <Button label={t('video.tryAgain')} variant="secondary" icon={<RotateCcw size={16} />} onClick={() => { setAnswers({}); setSubmitted(false); }} />
              )}
              <Button label={t('video.viewVocabulary')} variant="ghost" onClick={() => setStep('vocabulary')} />
              <Button label={t('video.newLesson')} variant="ghost" onClick={reset} />
            </div>
          </div>
        </section>
      )}

      {step === 'vocabulary' && lesson && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6">
            <h2 className="text-xl font-bold">{t('video.vocabTitle')}</h2>
            <p className="text-sm text-slate-500 mt-1">{t('video.vocabHelp')}</p>
          </div>
          {lesson.vocabulary.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {lesson.vocabulary.map(item => (
                <article key={item.word} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black text-indigo-700 dark:text-indigo-300">{item.word}</h3>
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{item.cefr} · Band {item.band.toFixed(1)}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{item.definitionEn}</p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">{item.definitionVi}</p>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-900">{t('video.noVocabulary')}</div>
          )}
          <div className="mt-6 flex gap-3">
            <Button label={t('video.backPractice')} variant="secondary" onClick={() => setStep('practice')} />
            <Button label={t('video.newLesson')} variant="ghost" onClick={reset} />
          </div>
          <p className="mt-6 text-xs text-slate-400">{language === 'vi' ? t('video.methodVi') : t('video.methodEn')}</p>
        </section>
      )}
    </div>
  );
};
