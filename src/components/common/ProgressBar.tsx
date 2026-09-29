import React from 'react';

export interface ProgressBarProps {
  progress: number; // 0 to 100
  max?: number;
  label?: string;
  sublabel?: string;
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple';
  showPercentage?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  max = 100,
  label,
  sublabel,
  color = 'indigo',
  showPercentage = true,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((progress / max) * 100)));

  const colorMap = {
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    amber: 'bg-amber-500',
    rose: 'bg-rose-600',
    purple: 'bg-purple-600',
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
          <span>{label}</span>
          <div className="space-x-1">
            {sublabel && <span className="text-slate-400 font-normal">{sublabel}</span>}
            {showPercentage && <span className="font-semibold text-slate-800 dark:text-slate-100">{percentage}%</span>}
          </div>
        </div>
      )}
      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-300 ease-out ${colorMap[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
