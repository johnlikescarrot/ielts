import React, { useState } from 'react';
import { SPEAKING_QUESTIONS } from '../../data/speakingPrompts';
import { SpeakingQuestion, SpeakingPart } from '../../types';
import { storageService } from '../../storage/storageService';
import { useI18n } from '../../i18n/i18nContext';
import { VoiceRecorder } from '../common/VoiceRecorder';
import { Timer } from '../common/Timer';
import { Badge } from '../common/Badge';
import { Mic, Clock, Sparkles, Award, Lightbulb, CheckSquare } from 'lucide-react';

export const SpeakingLabView: React.FC = () => {
  const { language, t } = useI18n();
  const [activePart, setActivePart] = useState<SpeakingPart>(2);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(SPEAKING_QUESTIONS[1].id);
  const [selfScore, setSelfScore] = useState<number>(7.0);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [rubricChecks, setRubricChecks] = useState<Record<string, boolean>>({
    fluency: true,
    vocab: true,
    grammar: false,
    pronunciation: true,
  });

  const filteredQuestions = SPEAKING_QUESTIONS.filter((q) => q.part === activePart);
  const currentQuestion: SpeakingQuestion =
    SPEAKING_QUESTIONS.find((q) => q.id === selectedQuestionId) || filteredQuestions[0] || SPEAKING_QUESTIONS[0];

  const handleToggleCheck = (key: string) => {
    setRubricChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveAttempt = async () => {
    await storageService.addTestAttempt({
      skill: 'speaking',
      testId: currentQuestion.id,
      testTitle: `${currentQuestion.topic} (Part ${currentQuestion.part})`,
      estimatedBand: selfScore,
      timeSpentSeconds: 180,
      speakingNotes: `Self assessment completed. Band estimated: ${selfScore}`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Mic className="w-6 h-6 text-rose-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t('speaking.title')}</h1>
            <Badge variant="danger" size="sm">
              Part {activePart}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('speaking.subtitle')}</p>
        </div>

        {/* Part Switcher */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
          <button
            onClick={() => {
              setActivePart(1);
              const firstP1 = SPEAKING_QUESTIONS.find((q) => q.part === 1);
              if (firstP1) setSelectedQuestionId(firstP1.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePart === 1
                ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Part 1
          </button>
          <button
            onClick={() => {
              setActivePart(2);
              const firstP2 = SPEAKING_QUESTIONS.find((q) => q.part === 2);
              if (firstP2) setSelectedQuestionId(firstP2.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePart === 2
                ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Part 2 (Cue Card)
          </button>
          <button
            onClick={() => {
              setActivePart(3);
              const firstP3 = SPEAKING_QUESTIONS.find((q) => q.part === 3);
              if (firstP3) setSelectedQuestionId(firstP3.id);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activePart === 3
                ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Part 3
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cue Card & Questions */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Topic: {currentQuestion.topic}
              </span>
              {activePart === 2 && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-slate-500">1m Prep | 2m Speak</span>
                </div>
              )}
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
              {currentQuestion.prompt}
            </h2>

            {/* Cue card bullet points for Part 2 */}
            {currentQuestion.cueCardPoints && currentQuestion.cueCardPoints.length > 0 && (
              <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 rounded-xl space-y-2">
                <span className="text-xs font-bold text-rose-900 dark:text-rose-200">You should say:</span>
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  {currentQuestion.cueCardPoints.map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow up questions for Part 3 */}
            {currentQuestion.followUpQuestions && currentQuestion.followUpQuestions.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl space-y-2 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Discussion Questions:</span>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1">
                  {currentQuestion.followUpQuestions.map((fq, idx) => (
                    <li key={idx}>{fq}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timers */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
              {activePart === 2 ? (
                <>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500">{t('speaking.prepTimer')}:</span>
                    <Timer initialSeconds={60} autoStart={false} />
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500">{t('speaking.speakingTimer')}:</span>
                    <Timer initialSeconds={120} autoStart={false} />
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Practice Timer:</span>
                  <Timer initialSeconds={60} countUp={true} autoStart={false} />
                </div>
              )}
            </div>
          </div>

          {/* Voice Recorder Component */}
          <VoiceRecorder />

          {/* Model Answer Toggle */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{t('speaking.modelAnswer')}</span>
              </span>
              <button
                onClick={() => setShowModelAnswer(!showModelAnswer)}
                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition"
              >
                {showModelAnswer ? 'Hide Sample' : 'Reveal Sample'}
              </button>
            </div>

            {showModelAnswer && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-line border border-slate-100 dark:border-slate-800">
                {currentQuestion.modelAnswer}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tips & Self-Evaluation Rubric */}
        <div className="lg:col-span-5 space-y-5">
          {/* Recommended Vocabulary & Collocations */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>{t('speaking.usefulIdioms')}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentQuestion.recommendedVocab.map((v, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          {/* Examiner Strategy Tips */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>{t('speaking.examinerTips')}</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {(language === 'vi' ? currentQuestion.tipsVi : currentQuestion.tipsEn).map((tip, i) => (
                <li key={i} className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Self-Assessment Rubric Box */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span>{t('speaking.selfEvaluation')}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rubricChecks.fluency}
                  onChange={() => handleToggleCheck('fluency')}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Fluency & Coherence (Spoke with minimal hesitation and natural linkers)
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rubricChecks.vocab}
                  onChange={() => handleToggleCheck('vocab')}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Lexical Resource (Used topic-specific collocations and idioms)
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rubricChecks.grammar}
                  onChange={() => handleToggleCheck('grammar')}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Grammar Range (Used complex sentences & accurate tenses)
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rubricChecks.pronunciation}
                  onChange={() => handleToggleCheck('pronunciation')}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Pronunciation (Clear intonation & syllable stress)
                </span>
              </label>
            </div>

            {/* Estimated Band Slider */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Self-Estimate Band:</span>
                <span className="font-bold text-rose-600 text-sm">Band {selfScore.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="5.0"
                max="9.0"
                step="0.5"
                value={selfScore}
                onChange={(e) => setSelfScore(parseFloat(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>

            <button
              onClick={handleSaveAttempt}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow transition text-xs active:scale-95"
            >
              Save Speaking Session to Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
