import React from 'react';
import { 
  BookOpen, 
  Headphones, 
  PenTool, 
  Mic, 
  Layers, 
  Award, 
  BarChart2, 
  Settings, 
  Globe, 
  LayoutDashboard,
  Video
} from 'lucide-react';
import { SkillType } from '../../types';
import { useI18n } from '../../i18n/i18nContext';
import { Badge } from './Badge';

export interface NavbarProps {
  activeTab: SkillType | 'dashboard' | 'settings';
  onSelectTab: (tab: SkillType | 'dashboard' | 'settings') => void;
  targetBand?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  targetBand = 7.5,
}) => {
  const { language, setLanguage, t } = useI18n();

  const navItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'reading', label: t('nav.reading'), icon: BookOpen },
    { id: 'listening', label: t('nav.listening'), icon: Headphones },
    { id: 'writing', label: t('nav.writing'), icon: PenTool },
    { id: 'speaking', label: t('nav.speaking'), icon: Mic },
    { id: 'vocabulary', label: t('nav.vocabulary'), icon: Layers },
    { id: 'video', label: t('nav.video'), icon: Video },
    { id: 'mock-test', label: t('nav.mockTest'), icon: Award },
    { id: 'analytics', label: t('nav.analytics'), icon: BarChart2 },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'vi' : 'en';
    setLanguage(nextLang);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-rose-600 flex items-center justify-center text-white font-black text-xl shadow-md shadow-indigo-500/20">
              9.0
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
                  IELTS<span className="text-indigo-600 dark:text-indigo-400">SLAYER</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase">
                  AST Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                {t('common.offlineReady')}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5 overflow-x-auto py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs lg:text-sm font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 font-semibold shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right controls: Target Band & Language switch */}
          <div className="flex items-center space-x-3">
            <Badge variant="primary" size="md" className="hidden lg:inline-flex">
              {t('common.target')}: Band {targetBand.toFixed(1)}
            </Badge>

            {/* Language Switch Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Switch English / Tiếng Việt"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-500" />
              <span>{language === 'en' ? 'EN 🇬🇧' : 'VI 🇻🇳'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="md:hidden flex items-center space-x-1 overflow-x-auto px-3 py-2 border-t border-slate-100 dark:border-slate-800">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id as any)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap font-medium ${
                isActive
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
