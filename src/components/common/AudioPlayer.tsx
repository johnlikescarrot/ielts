import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, FastForward, RotateCcw } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export interface AudioPlayerProps {
  transcriptText: string;
  durationSeconds?: number;
  onTimeUpdate?: (seconds: number) => void;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  transcriptText,
  durationSeconds = 120,
  onTimeUpdate,
  className = '',
}) => {
  const { t } = useI18n();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const intervalRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio();
    }
  };

  const playAudio = () => {
    setIsPlaying(true);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(transcriptText);
      utterance.rate = playbackSpeed;
      utterance.lang = 'en-GB';

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentTime(durationSeconds);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (onTimeUpdate) onTimeUpdate(next);
        if (next >= durationSeconds) {
          setIsPlaying(false);
          clearInterval(intervalRef.current);
          return durationSeconds;
        }
        return next;
      });
    }, 1000 / playbackSpeed);
  };

  const pauseAudio = () => {
    setIsPlaying(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const restartAudio = () => {
    pauseAudio();
    setCurrentTime(0);
    if (onTimeUpdate) onTimeUpdate(0);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);

    if (isPlaying) {
      pauseAudio();
      setTimeout(playAudio, 100);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`p-4 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">IELTS Audio Simulation</span>
        </div>

        {/* Waveform graphic */}
        <div className="flex items-end space-x-1 h-6">
          <span className={`w-1 bg-indigo-500 rounded-full ${isPlaying ? 'animate-soundwave-1' : 'h-1.5'}`} />
          <span className={`w-1 bg-indigo-400 rounded-full ${isPlaying ? 'animate-soundwave-2' : 'h-2'}`} />
          <span className={`w-1 bg-indigo-300 rounded-full ${isPlaying ? 'animate-soundwave-3' : 'h-3'}`} />
          <span className={`w-1 bg-indigo-400 rounded-full ${isPlaying ? 'animate-soundwave-4' : 'h-2'}`} />
          <span className={`w-1 bg-indigo-500 rounded-full ${isPlaying ? 'animate-soundwave-5' : 'h-1.5'}`} />
        </div>
      </div>

      {/* Progress track */}
      <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden mb-3">
        <div
          className="bg-indigo-500 h-full transition-all duration-300"
          style={{ width: `${(currentTime / durationSeconds) * 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-slate-400">
          {formatTime(currentTime)} / {formatTime(durationSeconds)}
        </span>

        <div className="flex items-center space-x-3">
          <button
            onClick={restartAudio}
            title={t('common.reset')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayPause}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition active:scale-95"
            aria-label={isPlaying ? t('common.pause') : t('common.play')}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 translate-x-0.5" />}
          </button>

          <button
            onClick={cycleSpeed}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg transition"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{playbackSpeed}x</span>
          </button>
        </div>
      </div>
    </div>
  );
};
