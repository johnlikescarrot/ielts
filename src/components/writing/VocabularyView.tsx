import React from 'react';
import { WritingPrompt } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { BookOpen } from 'lucide-react';

interface VocabularyViewProps {
  currentPrompt: WritingPrompt;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({
  currentPrompt,
}) => {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        <span>{t('writing.keyVocab')}</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentPrompt.keyVocabulary.map((kv, idx) => (
          <div
            key={idx}
            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                {kv.word}
              </span>
              <span className="text-xs text-slate-500">{kv.meaning}</span>
            </div>
            <p className="text-xs italic text-slate-700 dark:text-slate-300">
              "{kv.usage}"
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
