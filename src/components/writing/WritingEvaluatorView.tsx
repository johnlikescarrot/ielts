import React, { useState } from 'react';
import { WRITING_PROMPTS } from '../../data/writingPrompts';
import { WritingPrompt } from '../../types';
import { analyzeEssay } from '../../ast/essayAnalyzer';
import { EssayEvaluationReport } from '../../ast/types';
import { storageService } from '../../storage/storageService';
import { useI18n } from '../../i18n/i18nContext';
import { Timer } from '../common/Timer';
import { ProgressBar } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import {
  PenTool,
  Sparkles,
  Award,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  FileText,
  BarChart,
  Layers,
  Copy,
  Check
} from 'lucide-react';

export const WritingEvaluatorView: React.FC = () => {
  const { t } = useI18n();
  const [selectedPromptId, setSelectedPromptId] = useState<string>(WRITING_PROMPTS[0].id);
  const [essayText, setEssayText] = useState<string>('');
  const [evaluationReport, setEvaluationReport] = useState<EssayEvaluationReport | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'sample9' | 'sample7' | 'vocab'>('editor');
  const [copied, setCopied] = useState(false);

  const currentPrompt: WritingPrompt =
    WRITING_PROMPTS.find(p => p.id === selectedPromptId) || WRITING_PROMPTS[0];

  const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;
  const isWordCountValid = wordCount >= currentPrompt.minWordCount;

  const handleAnalyze = async () => {
    if (!essayText.trim()) return;

    const report = analyzeEssay(essayText, currentPrompt.minWordCount);
    setEvaluationReport(report);

    await storageService.addTestAttempt({
      skill: 'writing',
      testId: currentPrompt.id,
      testTitle: currentPrompt.title,
      estimatedBand: report.overallBand,
      timeSpentSeconds: currentPrompt.timeLimitMinutes * 60,
      essayText,
      essayAnalysis: report,
    });
  };

  const handleLoadSample = (sampleText: string) => {
    setEssayText(sampleText);
    setActiveTab('editor');
    const report = analyzeEssay(sampleText, currentPrompt.minWordCount);
    setEvaluationReport(report);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
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
            {WRITING_PROMPTS.map(p => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.type === 'task2-essay' ? 'Task 2' : 'Task 1'})
              </option>
            ))}
          </select>

          <Timer initialSeconds={currentPrompt.timeLimitMinutes * 60} countUp={false} />
        </div>
      </div>

      {/* Prompt Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="primary" size="sm">
              {currentPrompt.type === 'task2-essay' ? t('writing.task2') : t('writing.task1')}
            </Badge>
            <span className="text-xs font-medium text-slate-500">{currentPrompt.category}</span>
          </div>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {t('writing.targetMin')}: {currentPrompt.minWordCount} {t('common.words')} ({currentPrompt.timeLimitMinutes} {t('common.minutes')})
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

      {/* Tab Contents */}
      {activeTab === 'sample9' && (
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
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
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
            <strong>Examiner Breakdown:</strong> {currentPrompt.sampleAnalysis.taskAchievement}
          </div>
        </div>
      )}

      {activeTab === 'sample7' && (
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
      )}

      {activeTab === 'vocab' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <span>{t('writing.keyVocab')}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentPrompt.keyVocabulary.map((kv, idx) => (
              <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{kv.word}</span>
                  <span className="text-xs text-slate-500">{kv.meaning}</span>
                </div>
                <p className="text-xs italic text-slate-700 dark:text-slate-300">"{kv.usage}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Editor & Analysis split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor column */}
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
            <span className={`text-xs font-semibold ${isWordCountValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {isWordCountValid ? '✓ Minimum length satisfied' : `Needs ${Math.max(0, currentPrompt.minWordCount - wordCount)} more words`}
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

        {/* Evaluation Output column */}
        <div className="lg:col-span-5 space-y-4">
          {evaluationReport ? (
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
                  <div className="text-xs font-semibold text-slate-500">TR / Task Response</div>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Band {evaluationReport.taskAchievement.band.toFixed(1)}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">CC / Coherence</div>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Band {evaluationReport.coherenceCohesion.band.toFixed(1)}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">LR / Lexical</div>
                  <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                    Band {evaluationReport.lexicalResource.band.toFixed(1)}
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
                  <div className="text-xs font-semibold text-slate-500">GRA / Grammar</div>
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
                    <p className="font-bold text-slate-800 dark:text-slate-100">{evaluationReport.metrics.lexical.ttr}</p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-500">AWL Word Density:</span>
                    <p className="font-bold text-indigo-600 dark:text-indigo-400">{evaluationReport.metrics.lexical.awlDensityPercent}%</p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-500">Complex Sentence Ratio:</span>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">{(evaluationReport.metrics.grammatical.complexSentenceRatio * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <span className="text-slate-500">Flesch-Kincaid Grade:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Grade {evaluationReport.metrics.readability.fleschKincaidGrade}</p>
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
                    <div key={i} className="flex items-start space-x-2 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                      <span>{s}</span>
                    </div>
                  ))}

                  {/* Recommendations */}
                  {evaluationReport.grammaticalRange.recommendations.slice(0, 1).map((r, i) => (
                    <div key={i} className="flex items-start space-x-2 text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg">
                      <Lightbulb className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
                      <span>{r}</span>
                    </div>
                  ))}

                  {evaluationReport.taskAchievement.weaknesses.slice(0, 1).map((w, i) => (
                    <div key={i} className="flex items-start space-x-2 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center space-y-3 text-slate-400">
              <Layers className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-medium max-w-xs">
                Write your response or load a model sample, then click <strong>"Evaluate Essay"</strong> to trigger the AST rubric analyzer.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
