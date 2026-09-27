import React, { useState, useEffect } from 'react';
import { SkillType, UserSettings, TestAttempt, SRSCard } from '../../types';
import { storageService, DEFAULT_SETTINGS } from '../../storage/storageService';
import { getDeckSummary } from '../../srs/srsManager';
import { useI18n } from '../../i18n/i18nContext';
import { Badge } from '../common/Badge';
import {
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Layers,
  Award,
  ArrowRight,
  Flame,
  Sparkles,
  ChevronRight,
  Film
} from 'lucide-react';

export interface DashboardOverviewProps {
  onSelectSkill: (skill: SkillType | 'dashboard' | 'settings') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onSelectSkill }) => {
  const { t } = useI18n();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [srsCards, setSrsCards] = useState<SRSCard[]>([]);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    const s = await storageService.getSettings();
    setSettings(s);
    const h = await storageService.getTestHistory();
    setHistory(h);
    const cards = await storageService.getSRSCards();
    setSrsCards(cards);
  };

  const deckSummary = getDeckSummary(srsCards);

  // Calculate average band from recent attempts
  const validScores = history.filter(h => h.estimatedBand > 0).map(h => h.estimatedBand);
  const avgBand = validScores.length > 0
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
    : '7.5';

  const skillCards = [
    {
      id: 'reading' as SkillType,
      title: t('nav.reading'),
      description: t('dash.featureReadingDesc'),
      icon: BookOpen,
      color: 'from-blue-600 to-indigo-600',
      tag: 'Academic & GT',
    },
    {
      id: 'listening' as SkillType,
      title: t('nav.listening'),
      description: t('dash.featureListeningDesc'),
      icon: Headphones,
      color: 'from-purple-600 to-indigo-600',
      tag: 'Audio Player',
    },
    {
      id: 'writing' as SkillType,
      title: t('nav.writing'),
      description: t('dash.featureWritingDesc'),
      icon: PenTool,
      color: 'from-indigo-600 to-rose-600',
      tag: 'AST Writing Heuristic',
    },
    {
      id: 'speaking' as SkillType,
      title: t('nav.speaking'),
      description: t('dash.featureSpeakingDesc'),
      icon: Mic,
      color: 'from-rose-600 to-amber-600',
      tag: 'Voice Recorder',
    },
    {
      id: 'vocabulary' as SkillType,
      title: t('nav.vocabulary'),
      description: t('dash.featureVocabDesc'),
      icon: Layers,
      color: 'from-amber-600 to-emerald-600',
      tag: 'SM-2 Algorithm',
    },
    {
      id: 'video-lab' as SkillType,
      title: t('nav.videoLab'),
      description: t('videoLab.subtitle'),
      icon: Film,
      color: 'from-cyan-600 to-blue-600',
      tag: 'YouTube + Bilibili',
    },
    {
      id: 'mock-test' as SkillType,
      title: t('nav.mockTest'),
      description: 'Timed full exam simulation with authentic TRF score generation.',
      icon: Award,
      color: 'from-emerald-600 to-teal-600',
      tag: 'Full 4 Skills',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-700">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-semibold text-yellow-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% Free & Privacy-First IELTS Suite</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('dash.welcome')}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 max-w-xl">
              {t('dash.heroDescription', { band: settings.targetBand.toFixed(1) })}
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                {t('dash.dailyStreak')}
              </span>
              <div className="flex items-center justify-center space-x-1 mt-1 text-2xl font-black text-amber-400">
                <Flame className="w-6 h-6 fill-amber-400" />
                <span>3 {t('dash.days')}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 text-center min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                Estimated Band
              </span>
              <div className="text-2xl font-black text-yellow-300 mt-1">
                {avgBand}
              </div>
            </div>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl" />
      </div>

      {/* Spaced Repetition Due Alert (if any cards due) */}
      {deckSummary.dueToday > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {deckSummary.dueToday} {t('dash.srsReviewDue')}
              </h3>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                Retain high-band vocabulary permanently with SM-2 memory scheduling.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSelectSkill('vocabulary')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition active:scale-95 shrink-0"
          >
            <span>{t('dash.reviewNow')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Feature Navigation Grid */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {t('dash.quickStart')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => onSelectSkill(card.id)}
                className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="neutral" size="sm">
                      {card.tag}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {card.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span>{t('common.start')}</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {t('dash.recentAttempts')}
          </h2>
          <button
            onClick={() => onSelectSkill('analytics')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t('dash.viewAllHistory')}
          </button>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
            {history.slice(0, 4).map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">{item.testTitle}</div>
                  <div className="text-slate-400 text-[11px]">
                    {item.skill.toUpperCase()} • {new Date(item.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                  Band {item.estimatedBand.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            No practice sessions recorded yet. Launch a skill above to start preparing!
          </p>
        )}
      </div>
    </div>
  );
};
