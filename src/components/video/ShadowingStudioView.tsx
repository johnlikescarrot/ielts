import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  FastForward,
  Mic,
  Square,
  Volume2,
  BookOpen,
  Sparkles,
  Keyboard,
  Eye,
  EyeOff,
  PlusCircle,
  Check,
} from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Badge } from '@astryxdesign/core/Badge';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { useI18n } from '../../i18n/i18nContext';
import { storageService } from '../../storage/storageService';
import { SHADOWING_PRESETS, ShadowingPreset } from '../../data/shadowingPresets';
import {
  ShadowingSession,
  createShadowingSession,
  nextChunk,
  prevChunk,
  goToChunk,
  cyclePlaybackSpeed,
  incrementRepetition,
  attachChunkRecording,
  calculateShadowingMastery,
  SubtitlesVisibilityMode,
  ChunkingMode,
} from '../../video/shadowingSession';
import { formatTimestamp, getYouTubeVideoId, VideoVocabulary } from '../../video/videoLesson';

export const ShadowingStudioView: React.FC = () => {
  const { t, language } = useI18n();

  // Active Session State
  const [session, setSession] = useState<ShadowingSession>(() => {
    const defaultPreset = SHADOWING_PRESETS[0];
    return createShadowingSession({
      title: defaultPreset.title,
      sourceType: 'preset',
      sourceUrl: defaultPreset.youtubeId ? `https://www.youtube.com/watch?v=${defaultPreset.youtubeId}` : undefined,
      transcriptOrSubtitles: defaultPreset.subtitles,
      mode: 'cue',
      targetRepetitions: 3,
    });
  });

  // Source configuration state
  const [activeTab, setActiveTab] = useState<'presets' | 'youtube' | 'local'>('presets');
  const [customYoutubeUrl, setCustomYoutubeUrl] = useState('');
  const [customTranscript, setCustomTranscript] = useState('');
  const [chunkMode, setChunkMode] = useState<ChunkingMode>('cue');
  const [fixedDuration, setFixedDuration] = useState(8);
  const [targetReps, setTargetReps] = useState(3);
  const [localMediaUrl, setLocalMediaUrl] = useState<string | null>(null);
  const [localMediaType, setLocalMediaType] = useState<'video' | 'audio'>('video');

  // Playback & Interaction State
  const [isPlayingChunk, setIsPlayingChunk] = useState(false);
  const [isRecordingUser, setIsRecordingUser] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [userRecordingUrl, setUserRecordingUrl] = useState<string | null>(null);
  const [isPlayingUserRecording, setIsPlayingUserRecording] = useState(false);
  const [subtitlesMode, setSubtitlesMode] = useState<SubtitlesVisibilityMode>('full');
  const [addedVocabWords, setAddedVocabWords] = useState<Set<string>>(new Set());
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // References
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const autoAdvanceTimeoutRef = useRef<any>(null);

  const activeChunk = session.chunks[session.activeChunkIndex] || session.chunks[0];
  const mastery = useMemo(() => calculateShadowingMastery(session), [session]);

  const stopAllPlayback = useCallback(() => {
    setIsPlayingChunk(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (mediaRef.current) {
      mediaRef.current.pause();
    }
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
  }, []);

  const playActiveChunk = useCallback(() => {
    if (!activeChunk) return;
    stopAllPlayback();
    setIsPlayingChunk(true);

    if (localMediaUrl && mediaRef.current) {
      mediaRef.current.currentTime = activeChunk.startSeconds;
      mediaRef.current.playbackRate = session.playbackSpeed;
      mediaRef.current.play().catch(() => {});
    } else {
      // Speech Synthesis or Web Audio fallback for presets & transcripts
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(activeChunk.text);
        utterance.lang = 'en-GB';
        utterance.rate = session.playbackSpeed;

        utterance.onend = () => {
          setIsPlayingChunk(false);
          setSession(prev => incrementRepetition(prev));

          if (session.autoAdvance) {
            autoAdvanceTimeoutRef.current = setTimeout(() => {
              setSession(prev => {
                if (prev.activeChunkIndex < prev.chunks.length - 1) {
                  return nextChunk(prev);
                }
                return prev;
              });
            }, session.autoAdvanceDelaySeconds * 1000);
          }
        };

        utterance.onerror = () => {
          setIsPlayingChunk(false);
        };

        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingChunk(false);
      }
    }
  }, [activeChunk, localMediaUrl, session, stopAllPlayback]);

  // Handle local video/audio timeupdates to stop at chunk end
  const handleMediaTimeUpdate = () => {
    if (!mediaRef.current || !activeChunk || !isPlayingChunk) return;
    if (mediaRef.current.currentTime >= activeChunk.endSeconds) {
      mediaRef.current.pause();
      setIsPlayingChunk(false);
      setSession(prev => incrementRepetition(prev));

      if (session.autoAdvance) {
        autoAdvanceTimeoutRef.current = setTimeout(() => {
          setSession(prev => {
            if (prev.activeChunkIndex < prev.chunks.length - 1) {
              return nextChunk(prev);
            }
            return prev;
          });
        }, session.autoAdvanceDelaySeconds * 1000);
      }
    }
  };

  const handleNextChunk = useCallback(() => {
    stopAllPlayback();
    setUserRecordingUrl(null);
    setSession(prev => nextChunk(prev));
  }, [stopAllPlayback]);

  const handlePrevChunk = useCallback(() => {
    stopAllPlayback();
    setUserRecordingUrl(null);
    setSession(prev => prevChunk(prev));
  }, [stopAllPlayback]);

  const handleCycleSpeed = useCallback(() => {
    setSession(prev => ({
      ...prev,
      playbackSpeed: cyclePlaybackSpeed(prev.playbackSpeed),
    }));
  }, []);

  const handleToggleAutoAdvance = useCallback(() => {
    setSession(prev => ({
      ...prev,
      autoAdvance: !prev.autoAdvance,
    }));
  }, []);

  const handleToggleSubtitles = useCallback(() => {
    setSubtitlesMode(prev => {
      if (prev === 'full') return 'blur';
      if (prev === 'blur') return 'keywords';
      if (prev === 'keywords') return 'hidden';
      return 'full';
    });
  }, []);

  // Keyboard navigation & control shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        playActiveChunk();
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        handleNextChunk();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        handlePrevChunk();
      } else if (event.code === 'KeyR') {
        event.preventDefault();
        handleCycleSpeed();
      } else if (event.code === 'KeyA') {
        event.preventDefault();
        handleToggleAutoAdvance();
      } else if (event.code === 'KeyC') {
        event.preventDefault();
        handleToggleSubtitles();
      } else if (event.key === '?') {
        event.preventDefault();
        setShowShortcutsHelp(curr => !curr);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      stopAllPlayback();
    };
  }, [
    playActiveChunk,
    handleNextChunk,
    handlePrevChunk,
    handleCycleSpeed,
    handleToggleAutoAdvance,
    handleToggleSubtitles,
    stopAllPlayback,
  ]);

  // Load a curated preset
  const loadPreset = (preset: ShadowingPreset) => {
    stopAllPlayback();
    if (localMediaUrl) {
      URL.revokeObjectURL(localMediaUrl);
      setLocalMediaUrl(null);
    }
    const newSession = createShadowingSession({
      title: preset.title,
      sourceType: 'preset',
      sourceUrl: preset.youtubeId ? `https://www.youtube.com/watch?v=${preset.youtubeId}` : undefined,
      transcriptOrSubtitles: preset.subtitles,
      mode: chunkMode,
      fixedDurationSeconds: fixedDuration,
      targetRepetitions: targetReps,
    });
    setSession(newSession);
    setUserRecordingUrl(null);
  };

  // Load custom YouTube or transcript
  const loadCustomSession = () => {
    if (!customTranscript.trim()) return;
    stopAllPlayback();
    const newSession = createShadowingSession({
      title: customYoutubeUrl ? 'YouTube Shadowing Practice' : 'Custom Shadowing Session',
      sourceType: customYoutubeUrl ? 'youtube' : 'preset',
      sourceUrl: customYoutubeUrl || undefined,
      transcriptOrSubtitles: customTranscript,
      mode: chunkMode,
      fixedDurationSeconds: fixedDuration,
      targetRepetitions: targetReps,
    });
    setSession(newSession);
    setUserRecordingUrl(null);
  };

  // Local File Upload Handler
  const handleLocalMediaUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (localMediaUrl) {
      URL.revokeObjectURL(localMediaUrl);
    }

    const url = URL.createObjectURL(file);
    setLocalMediaUrl(url);
    setLocalMediaType(file.type.startsWith('audio') ? 'audio' : 'video');
  };

  const handleSubtitleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      if (content) {
        setCustomTranscript(content);
        const newSession = createShadowingSession({
          title: file.name.replace(/\.[^/.]+$/, ''),
          sourceType: 'local',
          transcriptOrSubtitles: content,
          mode: chunkMode,
          fixedDurationSeconds: fixedDuration,
          targetRepetitions: targetReps,
        });
        setSession(newSession);
      }
    };
    reader.readAsText(file);
  };

  // Voice recording for chunk repetition
  const startRecordingUser = async () => {
    setUserRecordingUrl(null);
    audioChunksRef.current = [];
    setRecordingDuration(0);

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone not available');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setUserRecordingUrl(url);
        setSession(prev => attachChunkRecording(prev, prev.activeChunkIndex, url));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingUser(true);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch {
      // Offline / sandbox fallback
      setIsRecordingUser(true);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecordingUser = () => {
    if (!isRecordingUser) return;
    setIsRecordingUser(false);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      const mockBlob = new Blob(['mock-shadowing-recording'], { type: 'audio/webm' });
      const url = URL.createObjectURL(mockBlob);
      setUserRecordingUrl(url);
      setSession(prev => attachChunkRecording(prev, prev.activeChunkIndex, url));
    }
    setSession(prev => incrementRepetition(prev));
  };

  const togglePlayUserRecording = () => {
    if (!userAudioPlayerRef.current) return;
    if (isPlayingUserRecording) {
      userAudioPlayerRef.current.pause();
      setIsPlayingUserRecording(false);
    } else {
      userAudioPlayerRef.current.play();
      setIsPlayingUserRecording(true);
    }
  };

  // Add vocabulary word to SRS deck
  const handleAddVocabToSRS = async (vocab: VideoVocabulary) => {
    await storageService.addCustomVocabulary({
      id: `vocab_${Date.now()}_${vocab.word}`,
      word: vocab.word,
      phonetic: '',
      partOfSpeech: 'academic',
      definitionEn: vocab.definitionEn,
      definitionVi: vocab.definitionVi,
      example: activeChunk.text,
      collocations: [],
      synonyms: [],
      topic: 'Shadowing Studio',
      bandScore: vocab.band,
      cefrLevel: (vocab.cefr as any) || 'C1',
      isAWL: true,
    });
    setAddedVocabWords(prev => new Set(prev).add(vocab.word.toLowerCase()));
  };

  // Render text according to subtitle mode
  const renderChunkText = (text: string) => {
    if (subtitlesMode === 'hidden') {
      return (
        <span className="text-slate-400 italic flex items-center justify-center gap-2">
          <EyeOff size={18} /> {t('shadowing.subtitlesHidden')}
        </span>
      );
    }

    if (subtitlesMode === 'blur') {
      return (
        <span className="blur-sm hover:blur-none transition-all duration-300 cursor-pointer select-none">
          {text}
        </span>
      );
    }

    const words = text.split(/\s+/);
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        {words.map((word, index) => {
          const clean = word.toLowerCase().replace(/[^a-z]/g, '');
          const isAcademic = activeChunk.vocabulary.some(v => v.word.toLowerCase() === clean);

          if (subtitlesMode === 'keywords' && !isAcademic) {
            return (
              <span key={index} className="opacity-30">
                {'•'.repeat(Math.max(2, word.length))}
              </span>
            );
          }

          if (isAcademic) {
            return (
              <span
                key={index}
                className="font-bold text-amber-500 dark:text-amber-300 underline decoration-amber-400 decoration-2 underline-offset-4"
              >
                {word}
              </span>
            );
          }

          return <span key={index}>{word}</span>;
        })}
      </div>
    );
  };

  const ytId = session.sourceUrl ? getYouTubeVideoId(session.sourceUrl) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Studio Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {t('shadowing.badge')}
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">{t('shadowing.title')}</h1>
            <p className="mt-2 text-indigo-200 text-sm sm:text-base leading-relaxed">
              {t('shadowing.subtitle')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              label={t('shadowing.shortcuts')}
              variant="secondary"
              size="sm"
              icon={<Keyboard size={16} />}
              onClick={() => setShowShortcutsHelp(curr => !curr)}
            />
          </div>
        </div>
      </section>

      {/* Main Studio Grid */}
      <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
        {/* Left Column: Player & Active Chunk Studio */}
        <div className="space-y-6">
          {/* Media Player Surface */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-white overflow-hidden shadow-lg">
            {localMediaUrl ? (
              localMediaType === 'video' ? (
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <video
                    ref={mediaRef as any}
                    src={localMediaUrl}
                    onTimeUpdate={handleMediaTimeUpdate}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center gap-4 bg-slate-950">
                  <Volume2 className="h-16 w-16 text-indigo-400 animate-pulse" />
                  <audio
                    ref={mediaRef as any}
                    src={localMediaUrl}
                    onTimeUpdate={handleMediaTimeUpdate}
                  />
                  <p className="text-sm font-semibold text-slate-300">{session.title}</p>
                </div>
              )
            ) : ytId ? (
              <div className="relative aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&start=${Math.floor(activeChunk?.startSeconds || 0)}`}
                  title="YouTube Shadowing Player"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="p-8 sm:p-12 text-center bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="purple" label={session.sourceType.toUpperCase()} />
                  <span className="text-xs font-semibold text-slate-400">{session.title}</span>
                </div>
                <div className="text-xs text-indigo-300 font-mono">
                  {formatTimestamp(activeChunk?.startSeconds || 0)} ➔ {formatTimestamp(activeChunk?.endSeconds || 0)}
                </div>
              </div>
            )}

            {/* Chunk Subtitles Display Surface */}
            <div className="p-6 bg-slate-950 border-t border-slate-800 text-center min-h-[120px] flex flex-col items-center justify-center">
              <div className="text-base sm:text-xl font-medium leading-relaxed max-w-2xl">
                {activeChunk ? renderChunkText(activeChunk.text) : t('shadowing.noChunk')}
              </div>

              {/* Subtitle Visibility Toggle Bar */}
              <div className="mt-4 flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleToggleSubtitles}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Cycle subtitle mode (Shortcut: C)"
                >
                  {subtitlesMode === 'full' && <><Eye size={13} className="text-emerald-400" /> {t('shadowing.modeFull')}</>}
                  {subtitlesMode === 'blur' && <><EyeOff size={13} className="text-amber-400" /> {t('shadowing.modeBlur')}</>}
                  {subtitlesMode === 'keywords' && <><BookOpen size={13} className="text-indigo-400" /> {t('shadowing.modeKeywords')}</>}
                  {subtitlesMode === 'hidden' && <><EyeOff size={13} className="text-rose-400" /> {t('shadowing.modeHidden')}</>}
                </button>
                <span className="text-[11px] text-slate-500">{t('shadowing.pressCToToggle')}</span>
              </div>
            </div>

            {/* Chunk Interactive Controls */}
            <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 space-y-4">
              {/* Progress Slider & Chunk Indicator */}
              <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                <span>
                  {t('shadowing.chunk')} {session.activeChunkIndex + 1} / {session.chunks.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] mr-1">{t('shadowing.reps')}:</span>
                  {Array.from({ length: activeChunk?.targetRepetitions || 3 }).map((_, rIdx) => {
                    const isDone = (activeChunk?.repetitionCount || 0) > rIdx;
                    return (
                      <span
                        key={rIdx}
                        className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${
                          isDone
                            ? 'bg-emerald-400 scale-110 shadow-sm shadow-emerald-500/50'
                            : 'bg-slate-700'
                        }`}
                        title={`${activeChunk?.repetitionCount || 0}/${activeChunk?.targetRepetitions || 3} ${t('shadowing.repsDone')}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Main Playback Bar */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Button
                  label={t('common.previous')}
                  variant="secondary"
                  size="md"
                  icon={<SkipBack size={18} />}
                  onClick={handlePrevChunk}
                  isDisabled={session.activeChunkIndex === 0}
                  tooltip="Previous chunk (←)"
                />

                <Button
                  label={isPlayingChunk ? t('common.pause') : t('shadowing.replayChunk')}
                  variant="primary"
                  size="lg"
                  icon={isPlayingChunk ? <Pause size={20} /> : <Play size={20} />}
                  onClick={playActiveChunk}
                  tooltip="Replay chunk (Spacebar)"
                />

                <Button
                  label={t('common.next')}
                  variant="secondary"
                  size="md"
                  icon={<SkipForward size={18} />}
                  onClick={handleNextChunk}
                  isDisabled={session.activeChunkIndex >= session.chunks.length - 1}
                  tooltip="Next chunk (→)"
                />
              </div>

              {/* Secondary Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={handleCycleSpeed}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-semibold transition"
                  title="Cycle playback speed (R)"
                >
                  <FastForward size={14} />
                  <span>{session.playbackSpeed}x</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleAutoAdvance}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
                    session.autoAdvance
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  title="Toggle auto-advance (A)"
                >
                  <RotateCcw size={14} />
                  <span>{session.autoAdvance ? t('shadowing.autoAdvanceOn') : t('shadowing.autoAdvanceOff')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Voice Recorder & Comparison Studio */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-rose-500" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {t('shadowing.recordAndCompare')}
                </h3>
              </div>
              <Badge
                variant={isRecordingUser ? 'error' : 'neutral'}
                label={isRecordingUser ? `${t('shadowing.recording')} ${recordingDuration}s` : t('shadowing.ready')}
              />
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {t('shadowing.recordHelp')}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {!isRecordingUser ? (
                <Button
                  label={t('shadowing.recordYourVoice')}
                  variant="primary"
                  size="md"
                  icon={<Mic size={18} />}
                  onClick={startRecordingUser}
                />
              ) : (
                <Button
                  label={t('shadowing.stopRecording')}
                  variant="destructive"
                  size="md"
                  icon={<Square size={18} />}
                  onClick={stopRecordingUser}
                />
              )}

              {userRecordingUrl && !isRecordingUser && (
                <div className="flex items-center gap-2">
                  <audio
                    ref={userAudioPlayerRef}
                    src={userRecordingUrl}
                    onEnded={() => setIsPlayingUserRecording(false)}
                    className="hidden"
                  />
                  <Button
                    label={isPlayingUserRecording ? t('common.pause') : t('shadowing.playYourVoice')}
                    variant="secondary"
                    size="md"
                    icon={isPlayingUserRecording ? <Pause size={16} /> : <Play size={16} />}
                    onClick={togglePlayUserRecording}
                  />
                  <Button
                    label={t('shadowing.compareOriginal')}
                    variant="ghost"
                    size="md"
                    icon={<Volume2 size={16} />}
                    onClick={playActiveChunk}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Academic Vocabulary Extraction in Active Chunk */}
          {activeChunk?.vocabulary && activeChunk.vocabulary.length > 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">
                    {t('shadowing.chunkVocabulary')}
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  {activeChunk.vocabulary.length} {t('common.words')}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {activeChunk.vocabulary.map(item => {
                  const isAdded = addedVocabWords.has(item.word.toLowerCase());
                  return (
                    <div
                      key={item.word}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                          {item.word}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="blue" label={`${item.cefr} · Band ${item.band.toFixed(1)}`} />
                          <button
                            type="button"
                            onClick={() => handleAddVocabToSRS(item)}
                            disabled={isAdded}
                            className={`p-1 rounded-lg text-xs font-semibold transition ${
                              isAdded
                                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                                : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950'
                            }`}
                            title={isAdded ? 'Added to Flashcards' : 'Add to SRS Flashcards'}
                          >
                            {isAdded ? <Check size={14} /> : <PlusCircle size={14} />}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{item.definitionEn}</p>
                      {language === 'vi' && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          {item.definitionVi}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Source Picker & Chunk Timeline */}
        <div className="space-y-6">
          {/* Mastery Progress Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>{t('shadowing.sessionMastery')}</span>
              <span className="text-indigo-600 dark:text-indigo-400">{mastery.masteryPercentage}%</span>
            </h3>

            <ProgressBar
              label={t('shadowing.sessionMastery')}
              isLabelHidden
              value={mastery.masteryPercentage}
              variant="accent"
            />

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                <div className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                  {mastery.masteredChunks}/{mastery.totalChunks}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('shadowing.mastered')}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                <div className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                  {mastery.totalRepetitions}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('shadowing.totalReps')}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                <div className="font-black text-indigo-600 dark:text-indigo-400 text-base">
                  {formatTimestamp(session.durationSeconds)}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{t('shadowing.length')}</div>
              </div>
            </div>
          </div>

          {/* Source Selector Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {t('shadowing.selectSource')}
            </h3>

            {/* Source Tab Toggle */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`py-1.5 rounded-lg transition ${
                  activeTab === 'presets'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {t('shadowing.tabPresets')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('youtube')}
                className={`py-1.5 rounded-lg transition ${
                  activeTab === 'youtube'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {t('shadowing.tabYoutube')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('local')}
                className={`py-1.5 rounded-lg transition ${
                  activeTab === 'local'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {t('shadowing.tabLocal')}
              </button>
            </div>

            {/* Chunk Strategy Settings */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {t('shadowing.chunkMode')}
                </label>
                <select
                  value={chunkMode}
                  aria-label={t('shadowing.chunkMode')}
                  onChange={e => setChunkMode(e.target.value as ChunkingMode)}
                  className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                >
                  <option value="cue">{t('shadowing.modeByCue')}</option>
                  <option value="sentence">{t('shadowing.modeBySentence')}</option>
                  <option value="fixed">{t('shadowing.modeByFixed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {t('shadowing.targetReps')}
                </label>
                <select
                  value={targetReps}
                  aria-label={t('shadowing.targetReps')}
                  onChange={e => setTargetReps(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                >
                  <option value={1}>1 Rep</option>
                  <option value={2}>2 Reps</option>
                  <option value={3}>3 Reps</option>
                  <option value={5}>5 Reps</option>
                </select>
              </div>
            </div>

            {chunkMode === 'fixed' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {t('shadowing.fixedDuration')} ({fixedDuration}s)
                </label>
                <input
                  type="range"
                  min={3}
                  max={30}
                  step={1}
                  value={fixedDuration}
                  onChange={e => setFixedDuration(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            )}

            {/* Presets List */}
            {activeTab === 'presets' && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {SHADOWING_PRESETS.map(preset => {
                  const isSelected = session.title === preset.title;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => loadPreset(preset)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60 dark:border-indigo-800 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {preset.partOrSection}
                        </span>
                        <Badge variant="blue" label={`Band ${preset.bandScore.toFixed(1)}`} />
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 font-medium">
                        {preset.title}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* YouTube & Custom Input */}
            {activeTab === 'youtube' && (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={customYoutubeUrl}
                  onChange={e => setCustomYoutubeUrl(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 outline-none focus:border-indigo-500"
                />
                <textarea
                  rows={4}
                  placeholder={t('video.transcriptPlaceholder')}
                  value={customTranscript}
                  onChange={e => setCustomTranscript(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono outline-none focus:border-indigo-500"
                />
                <Button
                  label={t('shadowing.loadYoutube')}
                  variant="primary"
                  size="sm"
                  onClick={loadCustomSession}
                  isDisabled={!customTranscript.trim()}
                />
              </div>
            )}

            {/* Local Media & Subtitles Drop */}
            {activeTab === 'local' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    {t('shadowing.mediaFile')}
                  </label>
                  <input
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleLocalMediaUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    {t('shadowing.subtitleFile')} (.srt, .vtt)
                  </label>
                  <input
                    type="file"
                    accept=".srt,.vtt,text/plain"
                    onChange={handleSubtitleFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Chunk Navigator List */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {t('shadowing.chunkList')} ({session.chunks.length})
            </h3>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {session.chunks.map((chunk, index) => {
                const isActive = session.activeChunkIndex === index;
                const isMastered = chunk.repetitionCount >= chunk.targetRepetitions;

                return (
                  <button
                    key={chunk.id}
                    type="button"
                    onClick={() => {
                      stopAllPlayback();
                      setSession(prev => goToChunk(prev, index));
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-start gap-2.5 ${
                      isActive
                        ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-800 dark:bg-indigo-950/50'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isMastered
                          ? 'bg-emerald-500 text-white'
                          : isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isMastered ? '✓' : index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-medium text-slate-800 dark:text-slate-200">
                        {chunk.text}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatTimestamp(chunk.startSeconds)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Helper Dialog */}
      {showShortcutsHelp && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-indigo-500" />
                {t('shadowing.shortcutsTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsHelp(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-600 dark:text-slate-300">{t('shadowing.keySpace')}</span>
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">Space</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-600 dark:text-slate-300">{t('shadowing.keyNext')}</span>
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">→</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-600 dark:text-slate-300">{t('shadowing.keyPrev')}</span>
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">←</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-600 dark:text-slate-300">{t('shadowing.keySpeed')}</span>
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">R</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-600 dark:text-slate-300">{t('shadowing.keyAuto')}</span>
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">A</kbd>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950">
                <span className="text-slate-600 dark:text-slate-300">{t('shadowing.keySubtitles')}</span>
                <kbd className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 font-mono font-bold">C</kbd>
              </div>
            </div>

            <Button
              label={t('common.cancel')}
              variant="secondary"
              size="sm"
              onClick={() => setShowShortcutsHelp(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
