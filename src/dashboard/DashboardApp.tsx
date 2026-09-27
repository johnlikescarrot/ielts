import React, { useState, useEffect } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { SkillType, UserSettings } from '../types';
import { storageService, DEFAULT_SETTINGS } from '../storage/storageService';
import { I18nProvider } from '../i18n/i18nContext';
import { Navbar } from '../components/common/Navbar';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import { ReadingPracticeView } from '../components/reading/ReadingPracticeView';
import { ListeningPracticeView } from '../components/listening/ListeningPracticeView';
import { WritingEvaluatorView } from '../components/writing/WritingEvaluatorView';
import { SpeakingLabView } from '../components/speaking/SpeakingLabView';
import { VocabularySRSView } from '../components/vocabulary/VocabularySRSView';
import { VideoStudyView } from '../components/video/VideoStudyView';
import { FullMockExamView } from '../components/mockTest/FullMockExamView';
import { AnalyticsView } from '../components/analytics/AnalyticsView';
import { SettingsView } from '../components/settings/SettingsView';

export const DashboardApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SkillType | 'dashboard' | 'settings'>('dashboard');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    storageService.getSettings().then(s => setSettings(s));
  }, []);

  return (
    <I18nProvider>
      <Theme theme={neutralTheme} mode={settings.theme}>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
          <Navbar
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            targetBand={settings.targetBand}
          />

          <main className="flex-1 pb-16">
            {activeTab === 'dashboard' && <DashboardOverview onSelectSkill={setActiveTab} />}
            {activeTab === 'reading' && <ReadingPracticeView />}
            {activeTab === 'listening' && <ListeningPracticeView />}
            {activeTab === 'writing' && <WritingEvaluatorView />}
            {activeTab === 'speaking' && <SpeakingLabView />}
            {activeTab === 'vocabulary' && <VocabularySRSView />}
            {activeTab === 'video-lab' && <VideoStudyView />}
            {activeTab === 'mock-test' && <FullMockExamView />}
            {activeTab === 'analytics' && <AnalyticsView />}
            {activeTab === 'settings' && <SettingsView />}
          </main>

          <footer className="py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>
                IELTS Slayer • 100% Free, Offline & Privacy-First Preparation Suite
              </span>
              <span>
                AST Heuristics Engine & SuperMemo SM-2 • Dual English/Vietnamese
              </span>
            </div>
          </footer>
        </div>
      </Theme>
    </I18nProvider>
  );
};
