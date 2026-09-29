import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileAudio, FileVideo, Pause, Play, RotateCcw, SkipBack, SkipForward, Upload } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';
import { TranscriptCue } from '../../video/videoLesson';
import { createShadowingChunks, findShadowingChunk, nextShadowingSpeed, SHADOWING_SPEEDS } from '../../video/shadowingPlayer';

interface ShadowingPlayerProps {
  cues: TranscriptCue[];
}

export const ShadowingPlayer: React.FC<ShadowingPlayerProps> = ({ cues }) => {
  const { t } = useI18n();
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaKind, setMediaKind] = useState<'audio' | 'video'>('audio');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const chunks = useMemo(() => createShadowingChunks(cues, duration), [cues, duration]);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (event.code === 'Space') { event.preventDefault(); togglePlayback(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); moveChunk(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); moveChunk(-1); }
      if (event.key.toLowerCase() === 'r') cycleSpeed();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = URL.createObjectURL(file);
    setMediaUrl(objectUrlRef.current);
    setMediaKind(file.type.startsWith('video/') ? 'video' : 'audio');
    setCurrentTime(0);
    setActiveIndex(0);
  };

  const seekTo = (seconds: number) => {
    const media = mediaRef.current;
    if (media) media.currentTime = seconds;
    setCurrentTime(seconds);
    setActiveIndex(Math.max(0, findShadowingChunk(chunks, seconds)));
  };

  function togglePlayback() {
    const media = mediaRef.current;
    if (mediaUrl && media) {
      if (media.paused) void media.play(); else media.pause();
      return;
    }
    const cue = chunks[activeIndex];
    if (!cue || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cue.text);
    utterance.rate = speed;
    utterance.lang = 'en-GB';
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }

  function moveChunk(delta: number) {
    if (chunks.length === 0) return;
    const next = Math.min(chunks.length - 1, Math.max(0, activeIndex + delta));
    setActiveIndex(next);
    seekTo(chunks[next].startSeconds);
  }

  function replayChunk() {
    seekTo(chunks[activeIndex]?.startSeconds ?? 0);
    togglePlayback();
  }

  function cycleSpeed() {
    const next = nextShadowingSpeed(speed);
    setSpeed(next);
    if (mediaRef.current) mediaRef.current.playbackRate = next;
  }

  const activeChunk = chunks[activeIndex];
  const progress = activeChunk ? Math.min(100, Math.max(0, ((currentTime - activeChunk.startSeconds) / Math.max(1, activeChunk.endSeconds - activeChunk.startSeconds)) * 100)) : 0;
  const MediaIcon = mediaKind === 'video' ? FileVideo : FileAudio;

  return (
    <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 dark:border-indigo-900 dark:bg-indigo-950/30" aria-labelledby="shadowing-player-heading">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="shadowing-player-heading" className="flex items-center gap-2 text-lg font-bold"><MediaIcon className="h-5 w-5 text-indigo-600" />{t('video.shadowingTitle')}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('video.shadowingHelp')}</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">
          <Upload className="h-4 w-4" /> {t('video.loadMedia')}
          <input type="file" accept="audio/*,video/*" className="sr-only" onChange={selectFile} />
        </label>
      </header>

      {mediaUrl && (mediaKind === 'video' ? <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={mediaUrl} className="mt-4 max-h-64 w-full rounded-xl bg-slate-950" onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => { const time = event.currentTarget.currentTime; setCurrentTime(time); setActiveIndex(Math.max(0, findShadowingChunk(chunks, time))); }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} controls aria-label={t('video.mediaLabel')} /> : <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={mediaUrl} onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => { const time = event.currentTarget.currentTime; setCurrentTime(time); setActiveIndex(Math.max(0, findShadowingChunk(chunks, time))); }} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} aria-label={t('video.mediaLabel')} />)}

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm dark:bg-slate-900" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">{t('video.currentChunk')} {activeIndex + 1} / {chunks.length || 1}</p>
        <p className="mt-2 min-h-12 text-lg font-semibold leading-7">{activeChunk?.text ?? t('video.noChunks')}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><span className="block h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <nav className="mt-4 flex flex-wrap items-center justify-center gap-2" aria-label={t('video.playerControls')}>
        <button type="button" onClick={() => moveChunk(-1)} aria-label={t('video.previousChunk')} className="rounded-lg p-2 text-indigo-700 hover:bg-indigo-100"><SkipBack className="h-5 w-5" /></button>
        <button type="button" onClick={replayChunk} aria-label={t('video.replayChunk')} className="rounded-lg bg-indigo-600 p-3 text-white hover:bg-indigo-700"><RotateCcw className="h-5 w-5" /></button>
        <button type="button" onClick={togglePlayback} aria-label={isPlaying ? t('common.pause') : t('common.play')} className="rounded-full bg-indigo-600 p-3 text-white hover:bg-indigo-700">{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
        <button type="button" onClick={() => moveChunk(1)} aria-label={t('video.nextChunk')} className="rounded-lg p-2 text-indigo-700 hover:bg-indigo-100"><SkipForward className="h-5 w-5" /></button>
        <button type="button" onClick={cycleSpeed} className="rounded-lg bg-indigo-100 px-3 py-2 text-xs font-bold text-indigo-800" aria-label={t('video.speedControl')}>{speed}×</button>
      </nav>
      <p className="mt-3 text-center text-xs text-slate-500">{t('video.shortcuts')} · {SHADOWING_SPEEDS.join('×, ')}×</p>
    </section>
  );
};
