import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, ExternalLink, Play, Repeat2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { TranscriptCue, formatTimestamp } from '../../video/videoLesson';

interface ShadowingPlayerProps {
  cues: TranscriptCue[];
  videoId: string | null;
  language: 'en' | 'vi';
}

const SPEEDS = [0.75, 0.9, 1, 1.25] as const;

export const ShadowingPlayer: React.FC<ShadowingPlayerProps> = ({ cues, videoId, language }) => {
  const [index, setIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(0.9);
  const [repetitions, setRepetitions] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const cue = cues[Math.min(index, cues.length - 1)];
  const copy = useMemo(() => language === 'vi' ? {
    title: 'Phòng luyện Shadowing', help: 'Nghe, bắt chước nhịp điệu và lặp lại trước khi chuyển đoạn.',
    previous: 'Đoạn trước', replay: 'Nghe lại đoạn', next: 'Đoạn tiếp', speed: 'Tốc độ phát',
    auto: 'Tự chuyển đoạn', source: 'Mở video gốc', counter: 'Lượt lặp', shortcut: 'Phím tắt: Space nghe lại · ← → chuyển đoạn · R đổi tốc độ',
  } : {
    title: 'Shadowing studio', help: 'Listen, imitate the rhythm, and repeat before moving on.',
    previous: 'Previous cue', replay: 'Replay cue', next: 'Next cue', speed: 'Playback speed',
    auto: 'Auto-advance', source: 'Open source video', counter: 'Repetitions', shortcut: 'Shortcuts: Space replay · ← → change cue · R change speed',
  }, [language]);

  const go = (delta: number) => setIndex(current => Math.max(0, Math.min(cues.length - 1, current + delta)));
  const cycleSpeed = () => setSpeed(current => SPEEDS[(SPEEDS.indexOf(current as typeof SPEEDS[number]) + 1) % SPEEDS.length]);
  const play = () => {
    window.speechSynthesis?.cancel();
    const utterance = new SpeechSynthesisUtterance(cue.text);
    utterance.lang = 'en-GB';
    utterance.rate = speed;
    utterance.onend = () => {
      setRepetitions(current => current + 1);
      if (autoAdvance) go(1);
    };
    window.speechSynthesis?.speak(utterance);
  };

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.code === 'Space') { event.preventDefault(); play(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); go(1); }
      if (event.key.toLowerCase() === 'r') { event.preventDefault(); cycleSpeed(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const openSource = () => window.open(
    `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(cue.startSeconds)}s`,
    '_blank',
    'noopener,noreferrer',
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm dark:border-slate-700 dark:bg-slate-800" aria-labelledby="shadowing-title">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="shadowing-title" className="text-xl font-bold flex items-center gap-2"><Repeat2 className="h-5 w-5 text-indigo-600" />{copy.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{copy.help}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">{index + 1} / {cues.length}</span>
      </header>

      <div className="rounded-2xl bg-slate-950 px-5 py-8 text-center text-white sm:px-10">
        <time className="text-xs font-bold tracking-widest text-indigo-300">{formatTimestamp(cue.startSeconds)}</time>
        <p className="mx-auto mt-4 max-w-3xl text-xl font-semibold leading-9 sm:text-2xl">{cue.text}</p>
        <p role="status" className="mt-4 text-xs text-slate-400">{copy.counter}: {repetitions}</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button label={copy.previous} variant="secondary" icon={<ArrowLeft size={16} />} onClick={() => go(-1)} isDisabled={index === 0} />
        <Button label={copy.replay} variant="primary" size="lg" icon={<Play size={18} />} onClick={play} />
        <Button label={copy.next} variant="secondary" icon={<ArrowRight size={16} />} onClick={() => go(1)} isDisabled={index === cues.length - 1} />
      </div>

      <div className="mt-6 grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-700">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{copy.speed}</legend>
          <div className="flex flex-wrap gap-2">
            {SPEEDS.map(value => <button key={value} type="button" aria-pressed={speed === value} onClick={() => setSpeed(value)} className={`rounded-lg px-3 py-2 text-sm font-bold ${speed === value ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-100'}`}>{value}×</button>)}
          </div>
        </fieldset>
        <div className="flex flex-col items-start gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={autoAdvance} onChange={event => setAutoAdvance(event.target.checked)} className="h-4 w-4 accent-indigo-600" />{copy.auto}</label>
          {videoId && <button type="button" onClick={openSource} className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 dark:text-indigo-300"><ExternalLink size={15} />{copy.source}</button>}
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-slate-400">{copy.shortcut}</p>
    </section>
  );
};
