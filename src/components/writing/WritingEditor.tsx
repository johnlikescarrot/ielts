import React from 'react';
import { WritingPrompt } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { ProgressBar } from '../common/ProgressBar';
import { Sparkles } from 'lucide-react';

interface WritingEditorProps {
  currentPrompt: WritingPrompt;
  essayText: string;
  setEssayText: (text: string) => void;
  wordCount: number;
  isWordCountValid: boolean;
  handleAnalyze: () => void;
}

export const WritingEditor: React.FC<WritingEditorProps> = ({
  currentPrompt,
  essayText,
  setEssayText,
  wordCount,
  isWordCountValid,
  handleAnalyze,
}) => {
  const { t } = useI18n();

  return (
    <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col space-y-4">
      {/* Word count progress */}
      <div className="space-y-1">
        <ProgressBar
          value={wordCount}
          max={currentPrompt.minWordCount}
          label={t('writing.wordCount')}
          sublabel={`${wordCount} / ${currentPrompt.minWordCount} words`}
          color={isWordCountValid ? 'emerald' : 'indigo'}
          showPercentage={false}
        />
      </div>

      <textarea
        rows={16}
        value={essayText}
        onChange={(e) => setEssayText(e.target.value)}
        placeholder={t('writing.placeholder')}
        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-sans"
      />

      <div className="flex items-center justify-between pt-2">
        <span
          className={`text-xs font-semibold ${
            isWordCountValid
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-amber-600 dark:text-amber-400'
          }`}
        >
          {isWordCountValid
            ? '✓ Minimum length satisfied'
            : `Needs ${Math.max(
                0,
                currentPrompt.minWordCount - wordCount
              )} more words`}
        </span>

        <button
          onClick={handleAnalyze}
          disabled={wordCount < 10}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition active:scale-95 text-sm"
        >
          <Sparkles className="w-4 h-4" />
          <span>{t('writing.analyzeNow')}</span>
        </button>
      </div>
    </div>
  );
};
