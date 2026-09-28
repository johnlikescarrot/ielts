import React, { useState } from 'react';
import { WRITING_PROMPTS } from '../../data/writingPrompts';
import { WritingPrompt } from '../../types';
import { analyzeEssay } from '../../ast/essayAnalyzer';
import { EssayEvaluationReport } from '../../ast/types';
import { storageService } from '../../storage/storageService';

import { PromptHeader } from './PromptHeader';
import { PromptCard } from './PromptCard';
import { SampleEssayView } from './SampleEssayView';
import { VocabularyView } from './VocabularyView';
import { WritingEditor } from './WritingEditor';
import { EvaluationOutput } from './EvaluationOutput';

export const WritingEvaluatorView: React.FC = () => {
  const [selectedPromptId, setSelectedPromptId] = useState<string>(
    WRITING_PROMPTS[0].id
  );
  const [essayText, setEssayText] = useState<string>('');
  const [evaluationReport, setEvaluationReport] =
    useState<EssayEvaluationReport | null>(null);
  const [activeTab, setActiveTab] = useState<
    'editor' | 'sample9' | 'sample7' | 'vocab'
  >('editor');

  const currentPrompt: WritingPrompt =
    WRITING_PROMPTS.find((p) => p.id === selectedPromptId) ||
    WRITING_PROMPTS[0];

  const wordCount = essayText.trim()
    ? essayText.trim().split(/\s+/).length
    : 0;
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <PromptHeader
        prompts={WRITING_PROMPTS}
        selectedPromptId={selectedPromptId}
        setSelectedPromptId={setSelectedPromptId}
        setEssayText={setEssayText}
        setEvaluationReport={setEvaluationReport}
        currentPrompt={currentPrompt}
      />

      <PromptCard
        currentPrompt={currentPrompt}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Tab Contents */}
      {(activeTab === 'sample9' || activeTab === 'sample7') && (
        <SampleEssayView
          currentPrompt={currentPrompt}
          activeTab={activeTab}
          handleLoadSample={handleLoadSample}
        />
      )}

      {activeTab === 'vocab' && <VocabularyView currentPrompt={currentPrompt} />}

      {/* Main Editor & Analysis split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <WritingEditor
          currentPrompt={currentPrompt}
          essayText={essayText}
          setEssayText={setEssayText}
          wordCount={wordCount}
          isWordCountValid={isWordCountValid}
          handleAnalyze={handleAnalyze}
        />

        {/* Evaluation Output column */}
        <div className="lg:col-span-5 space-y-4">
          <EvaluationOutput evaluationReport={evaluationReport} />
        </div>
      </div>
    </div>
  );
};
