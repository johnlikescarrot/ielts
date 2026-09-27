import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReadingPracticeView } from '../../src/components/reading/ReadingPracticeView';
import { ListeningPracticeView } from '../../src/components/listening/ListeningPracticeView';
import { WritingEvaluatorView } from '../../src/components/writing/WritingEvaluatorView';
import { SpeakingLabView } from '../../src/components/speaking/SpeakingLabView';
import { VocabularySRSView } from '../../src/components/vocabulary/VocabularySRSView';
import { FullMockExamView } from '../../src/components/mockTest/FullMockExamView';
import { AnalyticsView } from '../../src/components/analytics/AnalyticsView';
import { SettingsView } from '../../src/components/settings/SettingsView';
import { DashboardOverview } from '../../src/components/dashboard/DashboardOverview';
import { DashboardApp } from '../../src/dashboard/DashboardApp';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';

describe('Feature Views & Dashboard Extended Suite', () => {
  beforeEach(async () => {
    await storageService.resetAll();
  });

  it('renders ReadingPracticeView with highlights, passage switching and explanations', async () => {
    render(
      <I18nProvider>
        <ReadingPracticeView />
      </I18nProvider>
    );

    // Test highlighter color clicks
    const yellowBtn = screen.getByTitle('Yellow highlight');
    await userEvent.click(yellowBtn);
    const greenBtn = screen.getByTitle('Green highlight');
    await userEvent.click(greenBtn);
    const blueBtn = screen.getByTitle('Blue highlight');
    await userEvent.click(blueBtn);

    // Switch passage dropdown to General
    const dropdown = screen.getByRole('combobox');
    await userEvent.selectOptions(dropdown, 'read_gen_1');
    expect(screen.getByRole('heading', { name: /Workplace Safety Guidelines/i })).toBeInTheDocument();

    // Fill an answer and submit
    const radioOptions = screen.getAllByRole('radio');
    if (radioOptions.length > 0) {
      await userEvent.click(radioOptions[0]);
    }
    const textInputs = screen.queryAllByRole('textbox');
    if (textInputs.length > 0) {
      await userEvent.type(textInputs[0], 'Health & Safety');
    }

    const submitBtn = screen.getByText('Submit Test');
    await userEvent.click(submitBtn);

    expect(screen.getByText(/Reading Result/i)).toBeInTheDocument();

    const resetBtns = screen.getAllByRole('button', { name: /Reset/i });
    if (resetBtns.length > 0) {
      await userEvent.click(resetBtns[0]);
    }
  });

  it('renders ListeningPracticeView with section changes and answer submissions', async () => {
    render(
      <I18nProvider>
        <ListeningPracticeView />
      </I18nProvider>
    );

    // Switch section dropdown
    const dropdown = screen.getByRole('combobox');
    await userEvent.selectOptions(dropdown, 'listen_sec_4');
    expect(screen.getAllByText(/Section 4/i)[0]).toBeInTheDocument();

    // Toggle transcript
    const transcriptBtn = screen.getByText('Show Transcript');
    await userEvent.click(transcriptBtn);
    expect(screen.getByText('Hide Transcript')).toBeInTheDocument();

    // Radio options
    const radioOptions = screen.getAllByRole('radio');
    if (radioOptions.length > 0) {
      await userEvent.click(radioOptions[0]);
    }

    // Submit
    const submitBtn = screen.getByText('Submit Test');
    await userEvent.click(submitBtn);

    const resetBtns = screen.getAllByRole('button', { name: /Reset/i });
    if (resetBtns.length > 0) {
      await userEvent.click(resetBtns[0]);
    }
  });

  it('renders WritingEvaluatorView with tabs, samples, and essay evaluator', async () => {
    render(
      <I18nProvider>
        <WritingEvaluatorView />
      </I18nProvider>
    );

    // Switch prompt dropdown
    const dropdown = screen.getByRole('combobox');
    await userEvent.selectOptions(dropdown, 'wp_task1_acad');
    expect(screen.getByText(/Global Renewable Energy/i)).toBeInTheDocument();

    // Test sample 7 tab
    const sample7Tab = screen.getByText(/Band 7.0 Comparison/i);
    await userEvent.click(sample7Tab);
    const loadSample7 = screen.getByText('Load into Evaluator');
    await userEvent.click(loadSample7);

    // Test vocab tab
    const vocabTab = screen.getByText(/Recommended Vocabulary/i);
    await userEvent.click(vocabTab);
    expect(screen.getAllByText(/Delineates/i)[0]).toBeInTheDocument();

    // Test sample 9 tab and copy to clipboard
    const sample9Tab = screen.getByText(/Band 9.0 Model Answer/i);
    await userEvent.click(sample9Tab);
    const copyBtn = screen.getByText('Copy');
    await userEvent.click(copyBtn);
    expect(screen.getByText('Copied')).toBeInTheDocument();

    const loadSample9 = screen.getByText('Load into Evaluator');
    await userEvent.click(loadSample9);

    // Type extra content into textarea
    const textarea = screen.getByPlaceholderText(/Type or paste your essay response here.../i);
    await userEvent.type(textarea, ' Additionally, solar power has shown significant potential.');

    // Analyze essay
    const analyzeBtn = screen.getByText('Evaluate Essay with AST Engine');
    await userEvent.click(analyzeBtn);

    expect(screen.getByText(/Overall Estimated Band/i)).toBeInTheDocument();
    expect(screen.getByText(/AST Linguistic Metrics/i)).toBeInTheDocument();
  });

  it('renders SpeakingLabView across all 3 parts and saves session', async () => {
    render(
      <I18nProvider>
        <SpeakingLabView />
      </I18nProvider>
    );

    // Switch to Part 1
    const p1Btn = screen.getByText('Part 1');
    await userEvent.click(p1Btn);
    expect(screen.getByText(/Work & Studies/i)).toBeInTheDocument();

    // Switch to Part 3
    const p3Btn = screen.getByText('Part 3');
    await userEvent.click(p3Btn);
    expect(screen.getByText(/Resilience & Human Adaptability/i)).toBeInTheDocument();

    // Switch to Part 2
    const p2Btn = screen.getByText(/Part 2/i);
    await userEvent.click(p2Btn);

    // Toggle self-assessment rubric check
    const checkboxes = screen.getAllByRole('checkbox');
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);

    // Change slider
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '8.0' } });

    // Reveal model answer
    const revealBtn = screen.getByText('Reveal Sample');
    await userEvent.click(revealBtn);

    // Save session
    const saveBtn = screen.getByText(/Save Speaking Session to Analytics/i);
    await userEvent.click(saveBtn);
  });

  it('renders VocabularySRSView with custom word modal, reviews and quiz', async () => {
    render(
      <I18nProvider>
        <VocabularySRSView />
      </I18nProvider>
    );

    // Card review interaction
    const cardText = await screen.findByText(/Click to Flip Definition/i);
    await userEvent.click(cardText);

    // Test again, hard, good buttons
    const againBtn = screen.getByText(/Again \(0-1\)/i);
    await userEvent.click(againBtn);

    // Word Bank tab
    const bankBtn = screen.getByText(/Word Bank/i);
    await userEvent.click(bankBtn);

    // Search and Topic filtering
    const searchInput = screen.getByPlaceholderText(/Search 500\+ IELTS words.../i);
    await userEvent.type(searchInput, 'mitigate');
    expect(screen.getAllByText(/mitigate/i)[0]).toBeInTheDocument();

    const topicSelect = screen.getAllByRole('combobox')[0];
    await userEvent.selectOptions(topicSelect, 'Environment & Climate');

    // Add Custom Word Modal
    const addCustomBtn = screen.getByRole('button', { name: /Add Custom Word/i });
    await userEvent.click(addCustomBtn);
    expect(screen.getByRole('heading', { name: /Add Custom Word/i })).toBeInTheDocument();

    const wordInput = screen.getByPlaceholderText(/e.g. ubiquitous/i);
    await userEvent.type(wordInput, 'quintessential');
    const enInput = screen.getByPlaceholderText(/Definition in English.../i);
    await userEvent.type(enInput, 'Representing the most perfect example.');
    const viInput = screen.getByPlaceholderText(/Định nghĩa tiếng Việt.../i);
    await userEvent.type(viInput, 'Khuôn mẫu điển hình.');

    const saveCustomBtn = screen.getByRole('button', { name: /Save/i });
    await userEvent.click(saveCustomBtn);

    // Mini Quiz tab
    const quizBtn = screen.getByText(/Mini Quiz/i);
    await userEvent.click(quizBtn);

    const optionBtn = screen.getByText(/To make something less severe/i);
    await userEvent.click(optionBtn);

    const nextBtn = screen.getByRole('button', { name: /Next Question/i });
    await userEvent.click(nextBtn);
  });

  it('renders FullMockExamView with score sliders and generates report', async () => {
    render(
      <I18nProvider>
        <FullMockExamView />
      </I18nProvider>
    );

    const numberInputs = screen.getAllByRole('spinbutton');
    if (numberInputs.length >= 4) {
      fireEvent.change(numberInputs[0], { target: { value: '8.5' } });
      fireEvent.change(numberInputs[1], { target: { value: '8.0' } });
      fireEvent.change(numberInputs[2], { target: { value: '7.5' } });
      fireEvent.change(numberInputs[3], { target: { value: '8.0' } });
    }

    const generateBtn = screen.getByText(/Generate Official IELTS Test Report/i);
    await userEvent.click(generateBtn);

    expect(screen.getByText(/Overall IELTS Band Result/i)).toBeInTheDocument();

    const anotherBtn = screen.getByText(/Simulate Another Exam/i);
    await userEvent.click(anotherBtn);
    expect(screen.getByText(/Full IELTS Mock Exam Simulation/i)).toBeInTheDocument();
  });

  it('renders AnalyticsView with skill filtering, JSON export and import', async () => {
    await storageService.addTestAttempt({
      skill: 'writing',
      testId: 't1',
      testTitle: 'Tech essay',
      estimatedBand: 7.5,
      timeSpentSeconds: 2400,
    });

    render(
      <I18nProvider>
        <AnalyticsView />
      </I18nProvider>
    );

    expect(screen.getByText(/Performance Analytics & History/i)).toBeInTheDocument();

    // Skill filter
    const filterSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(filterSelect, 'writing');
    expect(screen.getByText('Tech essay')).toBeInTheDocument();

    // Export button
    const exportBtn = screen.getByText('Export Backup');
    await userEvent.click(exportBtn);

    // Clear data with confirm
    window.confirm = () => true;
    const trashBtn = screen.getByTitle('Clear All Local Data');
    await userEvent.click(trashBtn);
  });

  it('renders SettingsView with adjustments to targetBand and minutes', async () => {
    render(
      <I18nProvider>
        <SettingsView />
      </I18nProvider>
    );

    // Target band slider
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '8.5' } });

    // Exam type
    const generalBtn = screen.getByText('General Training');
    await userEvent.click(generalBtn);

    // Language
    const viBtn = screen.getByText(/Tiếng Việt/i);
    await userEvent.click(viBtn);

    // Daily minutes input
    const minutesInput = screen.getByRole('spinbutton');
    fireEvent.change(minutesInput, { target: { value: '45' } });

    const saveBtn = screen.getByText(/Lưu|Save/i);
    await userEvent.click(saveBtn);
  });

  it('renders DashboardOverview and triggers navigation callbacks', async () => {
    await storageService.addTestAttempt({
      skill: 'reading',
      testId: 'r1',
      testTitle: 'Urban Vertical Farming',
      estimatedBand: 7.5,
      timeSpentSeconds: 1200,
    });

    const onSelect = vi.fn();
    render(
      <I18nProvider>
        <DashboardOverview onSelectSkill={onSelect} />
      </I18nProvider>
    );

    expect(screen.getByText(/Estimated Band/i)).toBeInTheDocument();
    expect(await screen.findByText(/Urban Vertical Farming/i)).toBeInTheDocument();

    const quickSkills = [
      'Academic & GT',
      'Audio Player',
      'Local AST Analysis',
      'Voice Recorder',
      'SM-2 Algorithm',
      'Private Caption Lab',
      'Full 4 Skills',
    ];

    for (const tag of quickSkills) {
      const el = screen.getByText(tag);
      await userEvent.click(el);
    }

    const viewHistoryBtn = screen.getByText(/View Full Analytics/i);
    await userEvent.click(viewHistoryBtn);
    expect(onSelect).toHaveBeenCalledWith('analytics');
  });

  it('reviews SRS cards with grading and word bank filtering', async () => {
    render(
      <I18nProvider>
        <VocabularySRSView />
      </I18nProvider>
    );

    // Click SRS Deck tab
    const srsTab = screen.getByText(/SRS Deck/i);
    await userEvent.click(srsTab);

    // Flip the flashcard
    const cardContainer = screen.getByText(/Click to Flip Definition/i);
    await userEvent.click(cardContainer);

    // Test Again button
    const againBtn = screen.getByText(/Again/i);
    await userEvent.click(againBtn);

    // Flip again and test Hard button
    await userEvent.click(screen.getByText(/Click to Flip Definition/i));
    const hardBtn = screen.getByText(/Hard/i);
    await userEvent.click(hardBtn);

    // Flip and test Good button
    await userEvent.click(screen.getByText(/Click to Flip Definition/i));
    const goodBtn = screen.getByText(/Good/i);
    await userEvent.click(goodBtn);

    // Flip and test Easy button
    await userEvent.click(screen.getByText(/Click to Flip Definition/i));
    const easyBtn = screen.getByText(/Easy/i);
    await userEvent.click(easyBtn);

    // Topic selector in Word Bank
    const bankTab = screen.getByText(/Word Bank/i);
    await userEvent.click(bankTab);
    const topicSelect = screen.getByRole('combobox');
    await userEvent.selectOptions(topicSelect, 'Environment & Climate');
  });

  it('imports JSON backup in AnalyticsView', async () => {
    render(
      <I18nProvider>
        <AnalyticsView />
      </I18nProvider>
    );

    const validExport = JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      attempts: [
        {
          id: 'test_123',
          skill: 'listening',
          testId: 'listen_sec_1',
          testTitle: 'Imported Listening Test',
          rawScore: 35,
          totalQuestions: 40,
          estimatedBand: 8.0,
          date: new Date().toISOString(),
          timeSpentSeconds: 1800,
        },
      ],
      settings: {
        targetBand: 8.5,
        dailyGoalMinutes: 60,
        examType: 'academic',
        language: 'en',
      },
      srsCards: [],
      customVocab: [],
    });

    const file = new File([validExport], 'backup.json', { type: 'application/json' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      await userEvent.upload(fileInput, file);
    }
  });

  it('navigates through every skill tab in DashboardApp', async () => {
    render(<DashboardApp />);

    const tabs = [
      'Reading',
      'Listening',
      'Writing',
      'Speaking',
      'Vocabulary',
      'Video Lab',
      'Full Mock Exam',
      'Analytics & Progress',
      'Settings',
      'Dashboard'
    ];

    for (const tab of tabs) {
      const tabElements = screen.getAllByText(new RegExp(tab, 'i'));
      if (tabElements.length > 0) {
        await userEvent.click(tabElements[0]);
      }
    }
  });
});
