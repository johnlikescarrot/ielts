import React, { useState } from 'react';
import { calculateOverallBand, getCEFRLevel, getBandDescriptor } from '../../calculator/bandCalculator';
import { storageService } from '../../storage/storageService';
import { useI18n } from '../../i18n/i18nContext';
import { Badge } from '../common/Badge';
import { Award, RotateCcw, ArrowRight } from 'lucide-react';

export const FullMockExamView: React.FC = () => {
  const { language } = useI18n();
  const [stage, setStage] = useState<'intro' | 'active' | 'completed'>('intro');
  const [skillScores, setSkillScores] = useState<{
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
  }>({
    listening: 7.5,
    reading: 8.0,
    writing: 7.0,
    speaking: 7.5,
  });

  const overallBand = calculateOverallBand(skillScores);
  const cefr = getCEFRLevel(overallBand);
  const descriptors = getBandDescriptor(overallBand);

  const handleFinishExam = async () => {
    setStage('completed');
    await storageService.addTestAttempt({
      skill: 'mock-test',
      testId: `mock_${Date.now()}`,
      testTitle: 'Full IELTS 4-Skill Mock Exam Simulation',
      estimatedBand: overallBand,
      timeSpentSeconds: 9900, // ~165 mins
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {stage === 'intro' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Full IELTS Mock Exam Simulation
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Experience the complete timed examination simulation covering Listening, Reading, Writing AST Evaluator, and Speaking Lab with overall composite band scoring.
            </p>
          </div>

          {/* Quick Score Adjustment / Simulation input */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
              <label className="text-xs font-semibold text-slate-500">Listening Band:</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="9"
                value={skillScores.listening}
                onChange={(e) => setSkillScores(s => ({ ...s, listening: parseFloat(e.target.value) || 0 }))}
                className="w-full text-base font-bold bg-transparent outline-none text-indigo-600"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
              <label className="text-xs font-semibold text-slate-500">Reading Band:</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="9"
                value={skillScores.reading}
                onChange={(e) => setSkillScores(s => ({ ...s, reading: parseFloat(e.target.value) || 0 }))}
                className="w-full text-base font-bold bg-transparent outline-none text-indigo-600"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
              <label className="text-xs font-semibold text-slate-500">Writing Band:</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="9"
                value={skillScores.writing}
                onChange={(e) => setSkillScores(s => ({ ...s, writing: parseFloat(e.target.value) || 0 }))}
                className="w-full text-base font-bold bg-transparent outline-none text-indigo-600"
              />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
              <label className="text-xs font-semibold text-slate-500">Speaking Band:</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="9"
                value={skillScores.speaking}
                onChange={(e) => setSkillScores(s => ({ ...s, speaking: parseFloat(e.target.value) || 0 }))}
                className="w-full text-base font-bold bg-transparent outline-none text-indigo-600"
              />
            </div>
          </div>

          <button
            onClick={handleFinishExam}
            className="flex items-center justify-center space-x-2 w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition active:scale-98 text-sm"
          >
            <span>Generate Official IELTS Test Report (TRF)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {stage === 'completed' && (
        <div className="space-y-6">
          {/* Official TRF Card */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border-2 border-indigo-200 dark:border-indigo-900 p-8 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  IELTS Slayer • Test Report Form
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                  Overall IELTS Band Result
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="success" size="lg">CEFR {cefr}</Badge>
                <Badge variant="primary" size="lg">Band {overallBand.toFixed(1)}</Badge>
              </div>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl text-center space-y-1">
                <span className="text-xs text-slate-500 font-medium">Listening</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{skillScores.listening.toFixed(1)}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl text-center space-y-1">
                <span className="text-xs text-slate-500 font-medium">Reading</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{skillScores.reading.toFixed(1)}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl text-center space-y-1">
                <span className="text-xs text-slate-500 font-medium">Writing</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{skillScores.writing.toFixed(1)}</div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-2xl text-center space-y-1">
                <span className="text-xs text-slate-500 font-medium">Speaking</span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{skillScores.speaking.toFixed(1)}</div>
              </div>
            </div>

            {/* Official Competency Description */}
            <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1.5">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider">
                Official IELTS Competency Level
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {language === 'vi' ? descriptors.vi : descriptors.en}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Verified locally via offline Band Calculator.
              </span>
              <button
                onClick={() => setStage('intro')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Simulate Another Exam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
