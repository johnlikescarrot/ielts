import React, { useState } from 'react';
import { WritingPrompt } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { Award, FileText, Copy, Check } from 'lucide-react';

interface SampleEssayViewProps {
  currentPrompt: WritingPrompt;
  activeTab: 'sample9' | 'sample7';
  handleLoadSample: (sampleText: string) => void;
}

export const SampleEssayView: React.FC<SampleEssayViewProps> = ({
  currentPrompt,
  activeTab,
  handleLoadSample,
}) => {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (activeTab === 'sample9') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-500" />
            <span>{t('writing.sampleBand9')}</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => copyToClipboard(currentPrompt.sampleEssayBand9)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => handleLoadSample(currentPrompt.sampleEssayBand9)}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
            >
              Load into Evaluator
            </button>
          </div>
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl font-serif">
          {currentPrompt.sampleEssayBand9}
        </div>
        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900">
          <strong>Examiner Breakdown:</strong>{' '}
          {currentPrompt.sampleAnalysis.taskAchievement}
        </div>
      </div>
    );
  }

  if (activeTab === 'sample7') {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            <span>{t('writing.sampleBand7')}</span>
          </h3>
          <button
            onClick={() => handleLoadSample(currentPrompt.sampleEssayBand7)}
            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
          >
            Load into Evaluator
          </button>
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl font-serif">
          {currentPrompt.sampleEssayBand7}
        </div>
      </div>
    );
  }

  return null;
};
