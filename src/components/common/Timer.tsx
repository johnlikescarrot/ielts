import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { useI18n } from '../../i18n/i18nContext';

export interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
  autoStart?: boolean;
  countUp?: boolean;
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({
  initialSeconds,
  onTimeUp,
  autoStart = false,
  countUp = false,
  className = '',
}) => {
  const { t } = useI18n();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  const handleTimeUp = useCallback(() => {
    setIsRunning(false);
    if (onTimeUp) onTimeUp();
  }, [onTimeUp]);

  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (countUp) {
            return prev + 1;
          } else {
            if (prev <= 1) {
              clearInterval(interval);
              handleTimeUp();
              return 0;
            }
            return prev - 1;
          }
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, countUp, handleTimeUp]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(initialSeconds);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = !countUp && seconds > 0 && seconds <= 60;

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border bg-white dark:bg-slate-800 shadow-sm ${
        isLowTime
          ? 'border-rose-400 text-rose-600 animate-pulse bg-rose-50 dark:bg-rose-950/40'
          : 'border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
      } ${className}`}
    >
      <Clock className="w-4 h-4 text-indigo-500" />
      <span className="font-mono font-semibold text-sm tracking-wider">
        {formatTime(seconds)}
      </span>
      <button
        onClick={toggleTimer}
        aria-label={isRunning ? t('common.pause') : t('common.play')}
        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>
      <button
        onClick={resetTimer}
        aria-label={t('common.reset')}
        className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
