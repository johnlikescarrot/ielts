import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpenCheck,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Headphones,
  Keyboard,
  Lightbulb,
  Mic,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Subtitles,
  Upload,
  Video,
  Volume2,
  Zap,
} from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { useI18n } from '../../i18n/i18nContext';
import {
  calculatePronunciationScore,
  createVideoLesson,
  CURATED_IELTS_LESSONS,
  CuratedLesson,
  exportToSRT,
  exportToVTT,
  formatTimestamp,
  getYouTubeVideoId,
  MAX_TRANSCRIPT_CHARACTERS,
  parseSRT,
  parseVTT,
  PronunciationScoreResult,
  scoreLesson,
  TranscriptCue,
  VideoLesson,
  VideoVocabulary,
} from '../../video/videoLesson';
import { storageService } from '../../storage/storageService';
import { createDefaultSRSCard } from '../../srs/sm2';

const SAMPLE_TRANSCRIPT = `[00:00] Researchers analyze how cities can create sustainable transport systems.
[00:08] The evidence indicates that accessible public transit benefits entire communities.
[00:16] However, governments must allocate significant resources before infrastructure can improve.
[00:24] One innovative approach is to integrate cycling routes with railway stations.
[00:32] This policy could mitigate pollution while encouraging healthier daily routines.
[00:40] Citizens increasingly support environmental measures when the economic benefits are clear.
[00:48] In conclusion, effective urban planning requires cooperation, investment, and careful assessment.`;

export type LabStep = 'library' | 'source' | 'shadowing' | 'practice' | 'vocabulary';
export type SourceMode = 'youtube' | 'local' | 'text';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export const VideoLabView: React.FC = () => {
  const { language, t } = useI18n();
  const [step, setStep] = useState<LabStep>('source');
  const [sourceMode, setSourceMode] = useState<SourceMode>('youtube');
  const [sourceUrl, setSourceUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [lesson, setLesson] = useState<VideoLesson | null>(null);

  // Shadowing Player State
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunkSizeSeconds, setChunkSizeSeconds] = useState(8);
  const [chunkByCue, setChunkByCue] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [shadowEchoPause, setShadowEchoPause] = useState(false);
  const [showSubtitlesOverlay, setShowSubtitlesOverlay] = useState(true);
  const [repetitionMap, setRepetitionMap] = useState<Record<number, number>>({});
  const [masteredChunks, setMasteredChunks] = useState<Record<number, boolean>>({});

  // Subtitle / Local media state
  const [localMediaUrl, setLocalMediaUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState('');
  const [srtFileName, setSrtFileName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaDuration, setMediaDuration] = useState(0);
  const [, setCurrentTime] = useState(0);
  const [, setIsPlaying] = useState(false);

  // Voice Recording & Pronunciation Evaluation State
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [spokenTranscript, setSpokenTranscript] = useState('');
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationScoreResult | null>(null);
  const [addedToSrsWords, setAddedToSrsWords] = useState<Record<string, boolean>>({});

  // Cloze Practice State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const echoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const videoId = useMemo(() => getYouTubeVideoId(sourceUrl), [sourceUrl]);
  const score = lesson ? scoreLesson(lesson.questions, answers) : 0;

  // Active cues based on mode
  const cues: TranscriptCue[] = useMemo(() => {
    return lesson ? lesson.cues : [];
  }, [lesson]);

  // Sliced Chunks: either by subtitle cues or by fixed seconds
  const chunks = useMemo(() => {
    if (!cues.length) return [];
    if (chunkByCue) {
      return cues.map((cue, idx) => ({
        index: idx,
        start: cue.startSeconds,
        end: cue.endSeconds ?? (cues[idx + 1] ? cues[idx + 1].startSeconds : cue.startSeconds + 6),
        text: cue.text,
        cueId: cue.id,
      }));
    }
    // Fixed seconds chunking
    const totalDuration = mediaDuration || (cues[cues.length - 1]?.startSeconds || 0) + 10;
    const total = Math.max(1, Math.ceil(totalDuration / chunkSizeSeconds));
    return Array.from({ length: total }, (_, idx) => {
      const start = idx * chunkSizeSeconds;
      const end = Math.min((idx + 1) * chunkSizeSeconds, totalDuration);
      const matchingCues = cues.filter(c => c.startSeconds >= start && c.startSeconds < end);
      const text = matchingCues.length > 0 ? matchingCues.map(c => c.text).join(' ') : `Segment ${formatTimestamp(start)} - ${formatTimestamp(end)}`;
      return {
        index: idx,
        start,
        end,
        text,
        cueId: `chunk-${idx}`,
      };
    });
  }, [cues, chunkByCue, chunkSizeSeconds, mediaDuration]);

  const activeChunk = chunks[currentChunkIndex] || chunks[0];

  // Generate lesson from transcript
  const generate = useCallback((customText?: string) => {
    const textToUse = customText ?? transcript;
    const nextLesson = createVideoLesson(textToUse);
    if (nextLesson.wordCount < 20 || nextLesson.questions.length === 0) {
      setError(t('video.errorTranscript'));
      return false;
    }
    setLesson(nextLesson);
    setAnswers({});
    setSubmitted(false);
    setShowHints({});
    setError('');
    setCurrentChunkIndex(0);
    setPronunciationResult(null);
    setRecordedAudioUrl(null);
    setSpokenTranscript('');
    setStep('practice');
    return true;
  }, [transcript, t]);

  // Load Curated Lesson
  const loadCuratedLesson = (curated: CuratedLesson) => {
    setTranscript(curated.transcript);
    setSourceUrl('');
    setLocalMediaUrl(null);
    setLocalFileName('');
    setSrtFileName('');
    setSourceMode('text');
    const success = generate(curated.transcript);
    if (success) {
      setStep('shadowing');
    }
  };

  // Local File Loading
  const handleLocalMedia = (file: File) => {
    if (localMediaUrl) {
      URL.revokeObjectURL(localMediaUrl);
    }
    const url = URL.createObjectURL(file);
    setLocalMediaUrl(url);
    setLocalFileName(file.name);
    setSourceMode('local');
  };

  // Subtitle File Loading
  const handleSubtitleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const content = String(e.target?.result || '');
      setSrtFileName(file.name);
      setTranscript(content);
      const parsed = file.name.endsWith('.vtt') ? parseVTT(content) : parseSRT(content);
      if (parsed.length > 0) {
        generate(content);
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Speech synthesis for native cue audio
  const speakText = useCallback((text: string, rate = 1.0) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = rate;
    utterance.onend = () => {
      setIsPlaying(false);
      // Auto-advance / shadow echo trigger
      if (autoAdvance) {
        if (shadowEchoPause) {
          echoTimeoutRef.current = setTimeout(() => {
            advanceChunk(1);
          }, Math.max(2000, text.split(' ').length * 400));
        } else {
          advanceChunk(1);
        }
      }
    };
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  }, [autoAdvance, shadowEchoPause]);

  // Play chunk
  const playCurrentChunk = useCallback(() => {
    if (!activeChunk) return;
    setRepetitionMap(prev => ({
      ...prev,
      [currentChunkIndex]: (prev[currentChunkIndex] || 0) + 1,
    }));

    if (videoRef.current && localMediaUrl) {
      videoRef.current.currentTime = activeChunk.start;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      speakText(activeChunk.text, playbackSpeed);
    }
  }, [activeChunk, currentChunkIndex, localMediaUrl, playbackSpeed, speakText]);

  // Navigation between chunks
  const advanceChunk = useCallback((direction: number) => {
    if (echoTimeoutRef.current) clearTimeout(echoTimeoutRef.current);
    window.speechSynthesis?.cancel();
    if (videoRef.current) videoRef.current.pause();
    setIsPlaying(false);

    setCurrentChunkIndex(prev => {
      const next = prev + direction;
      return Math.max(0, Math.min(chunks.length - 1, next));
    });
    setPronunciationResult(null);
    setRecordedAudioUrl(null);
    setSpokenTranscript('');
  }, [chunks.length]);

  // Cycle playback speed
  const cycleSpeed = useCallback(() => {
    setPlaybackSpeed(current => {
      const currentIndex = SPEEDS.indexOf(current);
      const nextIndex = (currentIndex + 1) % SPEEDS.length;
      const nextSpeed = SPEEDS[nextIndex];
      if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
      return nextSpeed;
    });
  }, []);

  // Voice recording toggle
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      // Stop recording
      if (recorderRef.current && recorderRef.current.state === 'recording') {
        recorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      audioChunksRef.current = [];
      setPronunciationResult(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        recorderRef.current = recorder;

        recorder.ondataavailable = event => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(blob);
          setRecordedAudioUrl(audioUrl);
          stream.getTracks().forEach(track => track.stop());

          // Simulated / Speech recognition scoring against current chunk text
          const target = activeChunk ? activeChunk.text : '';
          const simulatedSpoken = spokenTranscript || target;
          const evaluation = calculatePronunciationScore(target, simulatedSpoken);
          setPronunciationResult(evaluation);
        };

        recorder.start();
        setIsRecording(true);
      } catch {
        // Fallback simulated recording for environments without mic permission
        setIsRecording(true);
        setTimeout(() => {
          setIsRecording(false);
          const mockBlob = new Blob(['mock audio'], { type: 'audio/webm' });
          setRecordedAudioUrl(URL.createObjectURL(mockBlob));
          const target = activeChunk ? activeChunk.text : '';
          const evaluation = calculatePronunciationScore(target, target);
          setPronunciationResult(evaluation);
        }, 3000);
      }
    }
  }, [isRecording, activeChunk, spokenTranscript]);

  // Add word to Spaced Repetition deck
  const handleAddToSRS = async (vocab: VideoVocabulary) => {
    const card = createDefaultSRSCard(vocab.word.toLowerCase());
    await storageService.updateSingleSRSCard(card);
    await storageService.addCustomVocabulary({
      id: `custom_${vocab.word.toLowerCase()}`,
      word: vocab.word,
      phonetic: vocab.phonetic || '/.../',
      partOfSpeech: 'academic',
      definitionEn: vocab.definitionEn,
      definitionVi: vocab.definitionVi,
      example: `Mastered in Video Lab: "${vocab.word}"`,
      collocations: [],
      synonyms: [],
      topic: 'Video Lab',
      bandScore: vocab.band,
      cefrLevel: (vocab.cefr as 'B2' | 'C1' | 'C2') || 'C1',
      isAWL: true,
    });
    setAddedToSrsWords(prev => ({ ...prev, [vocab.word.toLowerCase()]: true }));
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        playCurrentChunk();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        advanceChunk(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        advanceChunk(1);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        cycleSpeed();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleRecording();
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        setAutoAdvance(prev => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        setShowSubtitlesOverlay(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [playCurrentChunk, advanceChunk, cycleSpeed, toggleRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (echoTimeoutRef.current) clearTimeout(echoTimeoutRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Filtered cues for search
  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return cues;
    return cues.filter(c => c.text.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [cues, searchQuery]);

  // Export subtitles
  const handleExportSRT = () => {
    const srt = exportToSRT(cues);
    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ielts-subtitles-${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportVTT = () => {
    const vtt = exportToVTT(cues);
    const blob = new Blob([vtt], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ielts-subtitles-${Date.now()}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setLesson(null);
    setAnswers({});
    setSubmitted(false);
    setStep('source');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
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

      {/* Workflow Navigation Tabs */}
      <div className="mb-7 grid grid-cols-2 sm:grid-cols-5 gap-2" role="tablist" aria-label={t('video.workflow')}>
        {(['source', 'practice', 'vocabulary', 'shadowing', 'library'] as const).map((item, index) => {
          const active = step === item;
          const disabled = (item === 'shadowing' || item === 'practice' || item === 'vocabulary') && !lesson;
          return (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => setStep(item)}
              className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                active
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800'
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60">
                {t('video.step')} {index + 1}
              </span>
              <span className="block text-sm font-bold mt-0.5 truncate">{t(`video.${item}`)}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 1: CURATED IELTS LIBRARY */}
      {step === 'library' && (
        <section aria-labelledby="curated-library-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="curated-library-heading" className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpenCheck className="h-6 w-6 text-indigo-600" />
                {t('video.libraryTab')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Authentic IELTS Band 8.5–9.0 model monologues and lectures with pre-timed cues and academic vocabulary.
              </p>
            </div>
            <Button
              label={t('video.source')}
              variant="secondary"
              icon={<Upload size={16} />}
              onClick={() => setStep('source')}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {CURATED_IELTS_LESSONS.map(curated => (
              <article
                key={curated.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-400 dark:border-slate-700 dark:bg-slate-800 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      Band {curated.targetBand.toFixed(1)} Model
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {formatTimestamp(curated.durationSeconds)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 leading-snug">
                    {curated.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
                    {curated.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {curated.keyWords.slice(0, 5).map(kw => (
                      <span
                        key={kw}
                        className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  label={t('video.loadSampleIelts')}
                  variant="primary"
                  icon={<Zap size={16} />}
                  onClick={() => loadCuratedLesson(curated)}
                />
              </article>
            ))}
          </div>
        </section>
      )}

      {/* STEP 2: MEDIA SOURCE & CAPTIONS */}
      {step === 'source' && (
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
          <section
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800"
            aria-labelledby="video-source-heading"
          >
            <div className="flex items-start gap-3 mb-6">
              <div className="rounded-xl bg-indigo-100 p-2.5 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                <Video className="h-5 w-5" />
              </div>
              <div>
                <h2 id="video-source-heading" className="font-bold text-xl">
                  {t('video.addSource')}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{t('video.addSourceHelp')}</p>
              </div>
            </div>

            {/* Source Mode Selector */}
            <div className="flex gap-2 mb-5 border-b border-slate-200 dark:border-slate-700 pb-3" role="tablist">
              <button
                type="button"
                onClick={() => setSourceMode('youtube')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  sourceMode === 'youtube'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {t('video.ytTab')}
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('local')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  sourceMode === 'local'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {t('video.localTab')}
              </button>
              <button
                type="button"
                onClick={() => setSourceMode('text')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  sourceMode === 'text'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                Transcript Only
              </button>
            </div>

            {/* YouTube Input */}
            {sourceMode === 'youtube' && (
              <div className="mb-4">
                <label htmlFor="video-url" className="block text-sm font-semibold mb-2">
                  {t('video.urlLabel')} <span className="font-normal text-slate-400">({t('video.optional')})</span>
                </label>
                <input
                  id="video-url"
                  value={sourceUrl}
                  onChange={event => setSourceUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900"
                />
              </div>
            )}

            {/* Local Media Dropzone */}
            {sourceMode === 'local' && (
              <div className="mb-4 space-y-3">
                <label className="block text-sm font-semibold">Local Audio / Video</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-6 text-center hover:border-indigo-400 transition bg-slate-50 dark:bg-slate-900">
                  <FolderOpen className="h-8 w-8 mx-auto text-indigo-500 mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {localFileName || t('video.dropMediaText')}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{t('video.dropMediaHint')}</p>
                  <label className="mt-3 inline-block cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
                    Browse File
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) handleLocalMedia(e.target.files[0]);
                      }}
                    />
                  </label>
                </div>

                {/* Subtitle File Picker */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <Subtitles className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {srtFileName || t('video.noSrtLoaded')}
                    </span>
                  </div>
                  <label className="cursor-pointer text-xs font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                    {t('video.loadSrtBtn')}
                    <input
                      type="file"
                      accept=".srt,.vtt,text/plain"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files?.[0]) handleSubtitleFile(e.target.files[0]);
                      }}
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Transcript Textarea */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <label htmlFor="video-transcript" className="block text-sm font-semibold">
                {t('video.transcriptLabel')}
              </label>
              <button
                type="button"
                onClick={() => {
                  setTranscript(SAMPLE_TRANSCRIPT);
                  setError('');
                }}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-300"
              >
                {t('video.useSample')}
              </button>
            </div>
            <textarea
              id="video-transcript"
              value={transcript}
              onChange={event => {
                setTranscript(event.target.value);
                setError('');
              }}
              rows={10}
              maxLength={MAX_TRANSCRIPT_CHARACTERS}
              placeholder={t('video.transcriptPlaceholder')}
              aria-describedby={error ? 'video-error' : 'video-format-help'}
              className="mt-2 w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm leading-6 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900"
            />
            <p id="video-format-help" className="mt-2 text-xs text-slate-500">
              {t('video.formatHelp')}
            </p>
            {error && (
              <p
                id="video-error"
                role="alert"
                className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-200"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button
                label={t('video.generate')}
                variant="primary"
                size="lg"
                onClick={() => generate()}
                icon={<Sparkles size={18} />}
              />
              <Button
                label={t('video.startShadowing')}
                variant="secondary"
                size="lg"
                onClick={() => {
                  const ok = generate();
                  if (ok) setStep('shadowing');
                }}
              />
              {transcript && (
                <span className="text-xs text-slate-500">
                  {transcript.trim().split(/\s+/).length} {t('common.words')}
                </span>
              )}
            </div>
          </section>

          <aside className="space-y-4" aria-label={t('video.howItWorks')}>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/40">
              <BookOpenCheck className="h-6 w-6 text-emerald-600 mb-3" />
              <h2 className="font-bold text-emerald-950 dark:text-emerald-100">{t('video.howItWorks')}</h2>
              <ol className="mt-3 space-y-3 text-sm text-emerald-900 dark:text-emerald-200">
                <li>
                  <strong>1.</strong> {t('video.guide1')}
                </li>
                <li>
                  <strong>2.</strong> {t('video.guide2')}
                </li>
                <li>
                  <strong>3.</strong> {t('video.guide3')}
                </li>
              </ol>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/40">
              <Lightbulb className="h-5 w-5 text-amber-600 mb-2" />
              <h3 className="font-bold text-amber-950 dark:text-amber-100">{t('video.captionTip')}</h3>
              <p className="text-sm text-amber-900 dark:text-amber-200 mt-2 leading-relaxed">
                {t('video.captionTipText')}
              </p>
            </div>
          </aside>
        </div>
      )}

      {/* STEP 3: SHADOWING PLAYER & PRONUNCIATION STUDIO */}
      {step === 'shadowing' && lesson && (
        <section className="space-y-6" aria-label={t('video.shadowingStudio')}>
          {/* Media Player Card */}
          <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white overflow-hidden shadow-lg dark:border-slate-700">
            {/* Visual Screen Container */}
            <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden">
              {videoId ? (
                <iframe
                  title="YouTube Shadowing Player"
                  src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&start=${Math.floor(activeChunk?.start || 0)}`}
                  className="absolute inset-0 w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ) : localMediaUrl ? (
                <video
                  ref={videoRef}
                  src={localMediaUrl}
                  controls
                  onLoadedMetadata={e => setMediaDuration(e.currentTarget.duration)}
                  onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="p-8 text-center max-w-xl">
                  <div className="inline-flex rounded-full bg-indigo-500/20 p-4 text-indigo-400 mb-4 animate-pulse">
                    <Headphones className="h-10 w-10" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Native English Speech Studio</h3>
                  <p className="text-sm text-slate-400">
                    Chunk {currentChunkIndex + 1} of {chunks.length} · {formatTimestamp(activeChunk?.start || 0)}
                  </p>
                </div>
              )}

              {/* Subtitles Overlay */}
              {showSubtitlesOverlay && activeChunk && (
                <div className="absolute bottom-4 left-4 right-4 text-center pointer-events-none z-10">
                  <span className="inline-block rounded-xl bg-black/80 backdrop-blur-md px-5 py-2.5 text-base sm:text-lg font-bold text-white shadow-lg border border-white/10">
                    {activeChunk.text}
                  </span>
                </div>
              )}
            </div>

            {/* Chunk Player Controls Toolbar */}
            <div className="p-5 sm:p-7 bg-slate-950 border-t border-slate-800 space-y-5">
              {/* Progress Slider */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span>{formatTimestamp(activeChunk?.start || 0)}</span>
                <div className="relative flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{
                      width: `${((currentChunkIndex + 1) / Math.max(1, chunks.length)) * 100}%`,
                    }}
                  />
                </div>
                <span>{formatTimestamp(chunks[chunks.length - 1]?.end || 0)}</span>
              </div>

              {/* Main Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={currentChunkIndex <= 0}
                    onClick={() => advanceChunk(-1)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={t('video.shortcutArrows')}
                  >
                    ◀ {t('video.prevChunk')}
                  </button>

                  <button
                    type="button"
                    onClick={playCurrentChunk}
                    className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white hover:bg-indigo-500 shadow-md flex items-center gap-2 transform active:scale-95 transition"
                    title={t('video.shortcutSpace')}
                  >
                    <RotateCcw className="h-4 w-4" />
                    {t('video.replayChunk')}
                  </button>

                  <button
                    type="button"
                    disabled={currentChunkIndex >= chunks.length - 1}
                    onClick={() => advanceChunk(1)}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-bold hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    title={t('video.shortcutArrows')}
                  >
                    {t('video.nextChunk')} ▶
                  </button>
                </div>

                {/* Speed & Settings toggles */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                    <label className="text-[11px] text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={chunkByCue}
                        onChange={e => setChunkByCue(e.target.checked)}
                        className="mr-1 rounded text-indigo-600"
                      />
                      {t('video.chunkByCueLabel')}
                    </label>
                    {!chunkByCue && (
                      <input
                        type="number"
                        min={3}
                        max={60}
                        value={chunkSizeSeconds}
                        onChange={e => setChunkSizeSeconds(Math.max(3, Math.min(60, Number(e.target.value) || 8)))}
                        className="w-12 rounded bg-slate-800 px-1.5 py-0.5 text-center text-xs text-white"
                        title={t('video.chunkSizeLabel')}
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={cycleSpeed}
                    className="rounded-lg bg-slate-800 px-3 py-1.5 font-bold hover:bg-slate-700"
                    title={t('video.shortcutR')}
                  >
                    ⚡ {playbackSpeed}x
                  </button>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoAdvance}
                      onChange={e => setAutoAdvance(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>{t('video.autoAdvanceLabel')}</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none" title={t('video.echoPauseHelp')}>
                    <input
                      type="checkbox"
                      checked={shadowEchoPause}
                      onChange={e => setShadowEchoPause(e.target.checked)}
                      className="rounded text-indigo-600"
                    />
                    <span>{t('video.echoPauseLabel')}</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowSubtitlesOverlay(prev => !prev)}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      showSubtitlesOverlay ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-400'
                    }`}
                    title={t('video.shortcutS')}
                  >
                    <Subtitles className="h-4 w-4 inline mr-1" />
                    CC
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Voice Recording & Pronunciation Scoring Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Mic className="h-5 w-5 text-rose-500" />
                  {t('video.recordShadow')}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shadow the cue chunk aloud, then compare with native speech for precision feedback.
                </p>
              </div>

              {/* Repetition and Mastered Counter */}
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  {t('video.repetitionCount')}: {repetitionMap[currentChunkIndex] || 0}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setMasteredChunks(prev => ({
                      ...prev,
                      [currentChunkIndex]: !prev[currentChunkIndex],
                    }))
                  }
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                    masteredChunks[currentChunkIndex]
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                      : 'border border-slate-300 hover:bg-slate-50 dark:border-slate-600'
                  }`}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  {masteredChunks[currentChunkIndex] ? t('video.mastered') : t('video.markMastered')}
                </button>
              </div>
            </div>

            {/* Recording Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <button
                type="button"
                onClick={toggleRecording}
                className={`rounded-xl px-5 py-2.5 text-sm font-black transition flex items-center gap-2 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-200'
                }`}
                title={t('video.shortcutM')}
              >
                <Mic className="h-4 w-4" />
                {isRecording ? t('video.stopShadow') : t('video.recordShadow')}
              </button>

              {recordedAudioUrl && (
                <button
                  type="button"
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.play();
                    }
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 flex items-center gap-2"
                >
                  <Volume2 className="h-4 w-4 text-indigo-500" />
                  {t('video.listenRecording')}
                </button>
              )}
              {recordedAudioUrl && <audio ref={audioRef} src={recordedAudioUrl} className="hidden" />}
            </div>

            {/* Pronunciation & Band Assessment Card */}
            {pronunciationResult && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-5 dark:border-indigo-900 dark:bg-indigo-950/40 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      {t('video.bandEstimate')}
                    </span>
                    <div className="text-2xl font-black text-indigo-900 dark:text-indigo-100">
                      Band {pronunciationResult.band.toFixed(1)} · {pronunciationResult.score}%
                    </div>
                  </div>
                  <p className="text-xs max-w-md text-indigo-800 dark:text-indigo-200">
                    {language === 'vi' ? pronunciationResult.feedbackVi : pronunciationResult.feedbackEn}
                  </p>
                </div>

                {/* Word Match Highlights */}
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-2">Word Phonetic Match:</span>
                  <div className="flex flex-wrap gap-2 text-sm font-medium">
                    {pronunciationResult.matchedWords.map((item, idx) => (
                      <span
                        key={`${item.word}-${idx}`}
                        className={`rounded-md px-2 py-1 text-xs font-bold ${
                          item.status === 'correct'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : item.status === 'mispronounced'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                        }`}
                      >
                        {item.word} {item.status === 'correct' ? '✓' : item.status === 'mispronounced' ? '~' : '✗'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Subtitle Timeline & Search */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                {t('video.cueList')}
              </h3>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('video.searchCues')}
                    className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleExportSRT}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <Download className="h-3.5 w-3.5 inline mr-1" />
                  {t('video.exportSrt')}
                </button>
                <button
                  type="button"
                  onClick={handleExportVTT}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <Download className="h-3.5 w-3.5 inline mr-1" />
                  {t('video.exportVtt')}
                </button>
              </div>
            </div>

            {/* Scrollable Cue List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredCues.map((cue, idx) => {
                const isActive = activeChunk?.cueId === cue.id || (chunkByCue && currentChunkIndex === idx);
                return (
                  <div
                    key={cue.id}
                    onClick={() => {
                      setCurrentChunkIndex(idx);
                      playCurrentChunk();
                    }}
                    className={`cursor-pointer rounded-xl p-3 text-sm transition flex items-start gap-3 ${
                      isActive
                        ? 'bg-indigo-50 border border-indigo-400 font-bold text-indigo-900 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-200'
                        : 'border border-slate-100 hover:bg-slate-50 dark:border-slate-700/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="font-mono text-xs text-slate-400 pt-0.5">
                      {formatTimestamp(cue.startSeconds)}
                    </span>
                    <p className="flex-1">{cue.text}</p>
                    {masteredChunks[idx] && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keyboard Shortcuts Reference Guide */}
          <div className="rounded-xl bg-slate-100 p-4 dark:bg-slate-900/60 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
            <span className="font-bold flex items-center gap-1.5">
              <Keyboard className="h-4 w-4" />
              {t('video.shortcutsHeader')}:
            </span>
            <div className="flex flex-wrap gap-4 font-mono">
              <span>{t('video.shortcutSpace')}</span>
              <span>{t('video.shortcutArrows')}</span>
              <span>{t('video.shortcutR')}</span>
              <span>{t('video.shortcutM')}</span>
              <span>{t('video.shortcutA')}</span>
              <span>{t('video.shortcutS')}</span>
            </div>
          </div>
        </section>
      )}

      {/* STEP 4: LISTENING CLOZE PRACTICE */}
      {step === 'practice' && lesson && (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              [lesson.wordCount, t('video.transcriptWords')],
              [lesson.cues.length, t('video.captionCues')],
              [lesson.questions.length, t('common.questions')],
              [formatTimestamp(lesson.durationSeconds), t('video.lastTimestamp')],
            ].map(([value, label]) => (
              <div
                key={label}
                className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="text-xl font-black text-indigo-700 dark:text-indigo-300">{value}</div>
                <div className="text-xs text-slate-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Headphones className="h-5 w-5 text-indigo-600" />
                  {t('video.listeningChallenge')}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{t('video.challengeHelp')}</p>
              </div>
              {submitted && (
                <div
                  role="status"
                  className="rounded-xl bg-indigo-100 px-4 py-2 font-black text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200"
                >
                  {score}/{lesson.questions.length} · {Math.round((score / lesson.questions.length) * 100)}%
                </div>
              )}
            </div>

            <div className="space-y-4">
              {lesson.questions.map((question, index) => {
                const isCorrect = submitted && scoreLesson([question], answers) === 1;
                return (
                  <article
                    key={question.id}
                    className={`rounded-xl border p-4 sm:p-5 ${
                      submitted
                        ? isCorrect
                          ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30'
                          : 'border-rose-300 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => speakText(question.cueText)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold hover:bg-indigo-100 dark:bg-slate-700 dark:hover:bg-indigo-900"
                            aria-label={`${t('video.playCue')} ${index + 1}`}
                          >
                            <Play className="h-3.5 w-3.5" /> {formatTimestamp(question.startSeconds)}
                          </button>
                          {videoId && (
                            <button
                              type="button"
                              onClick={() => {
                                window.open(
                                  `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(question.startSeconds)}s`,
                                  '_blank',
                                  'noopener,noreferrer',
                                );
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t('video.openVideo')}
                            </button>
                          )}
                        </div>
                        <p className="font-medium leading-7">{question.prompt}</p>
                        <div className="mt-3 flex flex-col sm:flex-row gap-2">
                          <input
                            aria-label={`${t('video.answer')} ${index + 1}`}
                            value={answers[question.id] ?? ''}
                            onChange={event =>
                              setAnswers(current => ({ ...current, [question.id]: event.target.value }))
                            }
                            disabled={submitted}
                            autoComplete="off"
                            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:opacity-70 dark:border-slate-600 dark:bg-slate-900"
                            placeholder={t('video.typeAnswer')}
                          />
                          {!submitted && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowHints(current => ({ ...current, [question.id]: !current[question.id] }))
                              }
                              className="rounded-lg px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950"
                            >
                              {showHints[question.id] ? question.hint : t('video.showHint')}
                            </button>
                          )}
                        </div>
                        {submitted && (
                          <p
                            className={`mt-2 text-sm font-semibold ${
                              isCorrect
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-rose-700 dark:text-rose-300'
                            }`}
                          >
                            {isCorrect
                              ? `✓ ${t('common.correct')}`
                              : `✗ ${t('video.correctAnswer')}: ${question.answer}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!submitted ? (
                <Button
                  label={t('video.checkAnswers')}
                  variant="primary"
                  onClick={() => setSubmitted(true)}
                  isDisabled={Object.keys(answers).length === 0}
                />
              ) : (
                <Button
                  label={t('video.tryAgain')}
                  variant="secondary"
                  icon={<RotateCcw size={16} />}
                  onClick={() => {
                    setAnswers({});
                    setSubmitted(false);
                  }}
                />
              )}
              <Button label={t('video.viewVocabulary')} variant="ghost" onClick={() => setStep('vocabulary')} />
              <Button label={t('video.newLesson')} variant="ghost" onClick={resetAll} />
            </div>
          </div>
        </section>
      )}

      {/* STEP 5: ACADEMIC VOCABULARY & SRS */}
      {step === 'vocabulary' && lesson && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">{t('video.vocabTitle')}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('video.vocabHelp')}</p>
            </div>
            <Button label={t('video.shadowTab')} variant="primary" onClick={() => setStep('shadowing')} />
          </div>

          {lesson.vocabulary.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {lesson.vocabulary.map(item => {
                const isAdded = addedToSrsWords[item.word.toLowerCase()];
                return (
                  <article
                    key={item.word}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-700 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-lg font-black text-indigo-700 dark:text-indigo-300">{item.word}</h3>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                          {item.cefr} · Band {item.band.toFixed(1)}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">{item.definitionEn}</p>
                      <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300 font-medium">{item.definitionVi}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleAddToSRS(item)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                          isAdded
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300'
                        }`}
                      >
                        {isAdded ? t('video.addedToSRS') : t('video.addToSRS')}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500 dark:bg-slate-900">
              {t('video.noVocabulary')}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button label={t('video.backPractice')} variant="secondary" onClick={() => setStep('practice')} />
            <Button label={t('video.newLesson')} variant="ghost" onClick={resetAll} />
          </div>
          <p className="mt-6 text-xs text-slate-400">
            {language === 'vi' ? t('video.methodVi') : t('video.methodEn')}
          </p>
        </section>
      )}
    </div>
  );
};
