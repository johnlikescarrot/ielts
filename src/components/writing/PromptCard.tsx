import React from 'react';
import { WritingPrompt } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { Badge } from '../common/Badge';

interface PromptCardProps {
  currentPrompt: WritingPrompt;
  activeTab: 'editor' | 'sample9' | 'sample7' | 'vocab';
  setActiveTab: (tab: 'editor' | 'sample9' | 'sample7' | 'vocab') => void;
}

export const PromptCard: React.FC<PromptCardProps> = ({
  currentPrompt,
  activeTab,
  setActiveTab,
}) => {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="primary" size="sm">
            {currentPrompt.type === 'task2-essay'
              ? t('writing.task2')
              : t('writing.task1')}
          </Badge>
          <span className="text-xs font-medium text-slate-500">
            {currentPrompt.category}
          </span>
        </div>
        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {t('writing.targetMin')}: {currentPrompt.minWordCount}{' '}
          {t('common.words')} ({currentPrompt.timeLimitMinutes}{' '}
          {t('common.minutes')})
        </span>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
          {currentPrompt.prompt}
        </p>
        {currentPrompt.chartDescription && (
          <p className="text-xs italic text-slate-500 mt-2">
            Note: {currentPrompt.chartDescription}
          </p>
        )}
      </div>

      {/* Tab triggers for Model answers / Vocab */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'editor'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          Essay Editor
        </button>
        <button
          onClick={() => setActiveTab('sample9')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'sample9'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {t('writing.sampleBand9')}
        </button>
        <button
          onClick={() => setActiveTab('sample7')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'sample7'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {t('writing.sampleBand7')}
        </button>
        <button
          onClick={() => setActiveTab('vocab')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            activeTab === 'vocab'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {t('writing.keyVocab')}
        </button>
      </div>
    </div>
  );
};
