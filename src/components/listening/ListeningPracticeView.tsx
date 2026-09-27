import React, { useState } from 'react';
import { LISTENING_SECTIONS } from '../../data/listeningTests';
import { ListeningSection } from '../../types';
import { calculateListeningBand, getScoreBreakdown } from '../../calculator/bandCalculator';
import { storageService } from '../../storage/storageService';
import { useI18n } from '../../i18n/i18nContext';
import { AudioPlayer } from '../common/AudioPlayer';
import { Badge } from '../common/Badge';
import { Headphones, CheckCircle2, XCircle, FileText, RefreshCw, HelpCircle } from 'lucide-react';

export const ListeningPracticeView: React.FC = () => {
  const { language, t } = useI18n();
  const [selectedSectionId, setSelectedSectionId] = useState<string>(LISTENING_SECTIONS[0].id);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const currentSection: ListeningSection =
    LISTENING_SECTIONS.find(s => s.id === selectedSectionId) || LISTENING_SECTIONS[0];

  const handleAnswerChange = (questionId: string, value: string) => {
    if (isSubmitted) return;
    setUserAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitted(true);
    let rawScore = 0;
    currentSection.questions.forEach(q => {
      if (userAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        rawScore++;
      }
    });

    const totalQ = currentSection.questions.length;
    const band = calculateListeningBand(rawScore, totalQ);

    await storageService.addTestAttempt({
      skill: 'listening',
      testId: currentSection.id,
      testTitle: currentSection.title,
      rawScore,
      totalQuestions: totalQ,
      estimatedBand: band,
      timeSpentSeconds: currentSection.audioDurationSeconds,
      answers: userAnswers,
    });
  };

  const handleReset = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setShowTranscript(false);
  };

  let rawCorrect = 0;
  if (isSubmitted) {
    currentSection.questions.forEach(q => {
      if (userAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        rawCorrect++;
      }
    });
  }
  const scoreReport = isSubmitted
    ? getScoreBreakdown('listening', rawCorrect, currentSection.questions.length)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Headphones className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('listening.title')}
            </h1>
            <Badge variant="purple" size="sm">
              {t('listening.section')} {currentSection.sectionNumber}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'vi' ? currentSection.contextVi : currentSection.contextEn}
          </p>
        </div>

        {/* Section Switcher */}
        <select
          value={selectedSectionId}
          onChange={(e) => {
            setSelectedSectionId(e.target.value);
            handleReset();
          }}
          className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100"
        >
          {LISTENING_SECTIONS.map(s => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Result banner if submitted */}
      {isSubmitted && scoreReport && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center font-black text-3xl border border-white/20 text-yellow-300">
              {scoreReport.bandScore.toFixed(1)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-indigo-200">
                  {t('listening.yourScore')}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                  CEFR {scoreReport.cefrLevel}
                </span>
              </div>
              <h2 className="text-xl font-bold mt-0.5">
                {rawCorrect} / {scoreReport.totalQuestions} {t('common.correct')} ({scoreReport.percentage}%)
              </h2>
              <p className="text-xs text-indigo-200 max-w-xl mt-1">
                {language === 'vi' ? scoreReport.skillDescriptorVi : scoreReport.skillDescriptorEn}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white text-indigo-900 rounded-xl font-bold text-sm shadow hover:bg-indigo-50 transition active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{t('common.reset')}</span>
          </button>
        </div>
      )}

      {/* Audio Player & Transcript Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <AudioPlayer
            transcriptText={currentSection.transcript}
            durationSeconds={currentSection.audioDurationSeconds}
          />

          {/* Transcript toggle button */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>Audio Transcript</span>
              </span>
              <button
                onClick={() => setShowTranscript(!showTranscript)}
                className="text-xs font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 transition"
              >
                {showTranscript ? t('listening.hideTranscript') : t('listening.showTranscript')}
              </button>
            </div>

            {showTranscript && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 max-h-96 overflow-y-auto text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-mono whitespace-pre-line bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
                {currentSection.transcript}
              </div>
            )}
          </div>
        </div>

        {/* Questions Panel */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {t('common.questions')} 1–{currentSection.questions.length}
              </h3>
              <span className="text-xs text-slate-500">
                {Object.keys(userAnswers).length} / {currentSection.questions.length} answered
              </span>
            </div>

            {currentSection.questions.map((q) => {
              const isCorrect = isSubmitted && userAnswers[q.id]?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition ${
                    isSubmitted
                      ? isCorrect
                        ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/30'
                        : 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/30'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                      Q{q.questionNumber}
                    </span>
                    {isSubmitted && (
                      <div>
                        {isCorrect ? (
                          <span className="flex items-center space-x-1 text-emerald-600 text-xs font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t('common.correct')}</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1 text-rose-600 text-xs font-bold">
                            <XCircle className="w-4 h-4" />
                            <span>{t('common.incorrect')}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mb-3">
                    {q.prompt}
                  </p>

                  {q.options && q.options.length > 0 ? (
                    <div className="space-y-1.5">
                      {q.options.map((option, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center space-x-2.5 p-2 rounded-lg text-xs cursor-pointer transition ${
                            userAnswers[q.id] === option
                              ? 'bg-indigo-100 dark:bg-indigo-950/60 font-semibold text-indigo-900 dark:text-indigo-200'
                              : 'hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`lq_${q.id}`}
                            value={option}
                            checked={userAnswers[q.id] === option}
                            disabled={isSubmitted}
                            onChange={() => handleAnswerChange(q.id, option)}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Type answer..."
                      value={userAnswers[q.id] || ''}
                      disabled={isSubmitted}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  )}

                  {isSubmitted && (
                    <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                      <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-400 font-semibold">
                        <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{t('common.explanation')}: (Key: {q.correctAnswer})</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">
                        {language === 'vi' ? q.explanationVi : q.explanationEn}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 mt-4">
            {!isSubmitted ? (
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md transition active:scale-98 text-sm"
              >
                {t('common.submit')}
              </button>
            ) : (
              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-semibold rounded-xl transition text-sm"
              >
                {t('common.reset')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
