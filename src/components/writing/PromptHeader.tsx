import React from 'react';
import { WritingPrompt } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { Timer } from '../common/Timer';
import { Badge } from '../common/Badge';
import { PenTool } from 'lucide-react';

interface PromptHeaderProps {
  prompts: WritingPrompt[];
  selectedPromptId: string;
  setSelectedPromptId: (id: string) => void;
  setEssayText: (text: string) => void;
  setEvaluationReport: (report: null) => void;
  currentPrompt: WritingPrompt;
}

export const PromptHeader: React.FC<PromptHeaderProps> = ({
  prompts,
  selectedPromptId,
  setSelectedPromptId,
  setEssayText,
  setEvaluationReport,
  currentPrompt,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <PenTool className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t('writing.title')}
          </h1>
          <Badge variant="purple" size="sm">
            AST Astryx Engine
          </Badge>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('writing.subtitle')}
        </p>
      </div>

      {/* Prompt selector & Timer */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedPromptId}
          onChange={(e) => {
            setSelectedPromptId(e.target.value);
            setEssayText('');
            setEvaluationReport(null);
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
        >
          {prompts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p.type === 'task2-essay' ? 'Task 2' : 'Task 1'})
            </option>
          ))}
        </select>

        <Timer
          initialSeconds={currentPrompt.timeLimitMinutes * 60}
          countUp={false}
        />
      </div>
    </div>
  );
};
