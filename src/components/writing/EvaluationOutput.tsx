import React from 'react';
import { EssayEvaluationReport } from '../../ast/types';
import { useI18n } from '../../i18n/i18nContext';
import {
  BarChart,
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Layers,
} from 'lucide-react';

interface EvaluationOutputProps {
  evaluationReport: EssayEvaluationReport | null;
}

export const EvaluationOutput: React.FC<EvaluationOutputProps> = ({
  evaluationReport,
}) => {
  const { t } = useI18n();

  if (!evaluationReport) {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
        <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700" />
        <p className="text-xs font-medium max-w-xs">
          Write your response or load a model sample, then click{' '}
          <strong>"Evaluate Essay"</strong> to trigger the AST rubric analyzer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Score Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-indigo-700 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
            {t('writing.overallBand')}
          </span>
          <div className="flex items-baseline space-x-2 mt-0.5">
            <span className="text-4xl font-black text-yellow-300">
              {evaluationReport.overallBand.toFixed(1)}
            </span>
            <span className="text-xs text-indigo-200">/ 9.0</span>
          </div>
        </div>
        <div className="text-right text-xs text-indigo-200">
          <div>{evaluationReport.metrics.lexical.totalWords} words</div>
          <div>{evaluationReport.metrics.grammatical.sentenceCount} sentences</div>
          <div>{evaluationReport.metrics.coherence.paragraphCount} paragraphs</div>
        </div>
      </div>

      {/* 4 Criteria Scores */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">
            TR / Task Response
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            Band {evaluationReport.taskAchievement.band.toFixed(1)}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">
            CC / Coherence
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            Band {evaluationReport.coherenceCohesion.band.toFixed(1)}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">
            LR / Lexical
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            Band {evaluationReport.lexicalResource.band.toFixed(1)}
          </div>
        </div>
        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">
            GRA / Grammar
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
            Band {evaluationReport.grammaticalRange.band.toFixed(1)}
          </div>
        </div>
      </div>

      {/* AST Linguistic Diagnostics */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <BarChart className="w-4 h-4 text-indigo-500" />
          <span>AST Linguistic Metrics</span>
        </span>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-slate-500">Lexical Diversity (TTR):</span>
            <p className="font-bold text-slate-800 dark:text-slate-100">
              {evaluationReport.metrics.lexical.ttr}
            </p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-slate-500">AWL Word Density:</span>
            <p className="font-bold text-indigo-600 dark:text-indigo-400">
              {evaluationReport.metrics.lexical.awlDensityPercent}%
            </p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-slate-500">Complex Sentence Ratio:</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400">
              {(
                evaluationReport.metrics.grammatical.complexSentenceRatio * 100
              ).toFixed(0)}
              %
            </p>
          </div>
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <span className="text-slate-500">Flesch-Kincaid Grade:</span>
            <p className="font-bold text-slate-800 dark:text-slate-100">
              Grade {evaluationReport.metrics.readability.fleschKincaidGrade}
            </p>
          </div>
        </div>
      </div>

      {/* Actionable Feedback */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>{t('writing.actionableTips')}</span>
        </span>

        <div className="space-y-2 text-xs">
          {/* Strengths */}
          {evaluationReport.lexicalResource.strengths.slice(0, 1).map((s, i) => (
            <div
              key={i}
              className="flex items-start space-x-2 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg"
            >
              <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
              <span>{s}</span>
            </div>
          ))}

          {/* Recommendations */}
          {evaluationReport.grammaticalRange.recommendations
            .slice(0, 1)
            .map((r, i) => (
              <div
                key={i}
                className="flex items-start space-x-2 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg"
              >
                <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                <span>{r}</span>
              </div>
            ))}

          {/* Weaknesses */}
          {evaluationReport.taskAchievement.weaknesses.slice(0, 1).map((w, i) => (
            <div
              key={i}
              className="flex items-start space-x-2 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg"
            >
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
