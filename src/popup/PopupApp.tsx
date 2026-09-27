import React, { useState, useEffect } from 'react';
import { INITIAL_VOCABULARY } from '../data/vocabularyBank';
import { VocabularyItem, UserSettings } from '../types';
import { storageService, DEFAULT_SETTINGS } from '../storage/storageService';
import { I18nProvider, useI18n } from '../i18n/i18nContext';
import { Badge } from '../components/common/Badge';
import { Button as AstryxButton } from '@astryxdesign/core/Button';
import { Card as AstryxCard } from '@astryxdesign/core/Card';
import {
  Volume2,
  ExternalLink,
  BookOpen,
  Headphones,
  PenTool,
  Mic,
  Layers,
  Flame,
  CheckCircle
} from 'lucide-react';

const PopupContent: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const [wordOfTheDay, setWordOfTheDay] = useState<VocabularyItem>(INITIAL_VOCABULARY[0]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    storageService.getSettings().then(s => setSettings(s));
    // Pick word based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const word = INITIAL_VOCABULARY[dayOfYear % INITIAL_VOCABULARY.length];
    setWordOfTheDay(word);
  }, []);

  const openDashboard = () => {
    if (typeof browser !== 'undefined' && browser.tabs && browser.runtime) {
      browser.tabs.create({ url: browser.runtime.getURL('dashboard.html') });
    } else {
      window.open('/dashboard.html', '_blank');
    }
  };

  const speakWord = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-GB';
      window.speechSynthesis.speak(u);
    }
  };

  const saveWord = async () => {
    await storageService.addCustomVocabulary(wordOfTheDay);
    setIsSaved(true);
  };

  return (
    <div className="w-[380px] min-h-[500px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 space-y-4 font-sans text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
            9.0
          </div>
          <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">
            IELTS<span className="text-indigo-600">SLAYER</span>
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => void setLanguage(language === 'en' ? 'vi' : 'en')}
            className="px-1.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            aria-label={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang tiếng Anh'}
          >
            {language === 'en' ? 'VI' : 'EN'}
          </button>
          <Badge variant="primary" size="sm">
            Band {settings.targetBand.toFixed(1)}
          </Badge>
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[10px] border border-amber-200">
            <Flame className="w-3 h-3 fill-amber-500" />
            <span>3d</span>
          </div>
        </div>
      </div>

      {/* Word of the Day Card */}
      <AstryxCard
        variant="default"
        elevation="low"
        padding={4}
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            {t('popup.wordOfTheDay')}
          </span>
          <Badge variant="neutral" size="sm">
            CEFR {wordOfTheDay.cefrLevel}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">
              {wordOfTheDay.word}
            </h3>
            <span className="text-[11px] font-mono text-slate-400">
              {wordOfTheDay.phonetic} • {wordOfTheDay.partOfSpeech}
            </span>
          </div>
          <button
            onClick={() => speakWord(wordOfTheDay.word)}
            aria-label={language === 'vi' ? 'Phát âm từ' : 'Pronounce word'}
            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-full transition"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        <p className="text-slate-700 dark:text-slate-300">
          {language === 'vi' ? wordOfTheDay.definitionVi : wordOfTheDay.definitionEn}
        </p>

        <p className="italic text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg text-[11px]">
          "{wordOfTheDay.example}"
        </p>

        <AstryxButton
          label={isSaved ? t('inspector.saved') : t('inspector.saveToFlashcards')}
          onClick={saveWord}
          variant={isSaved ? 'secondary' : 'primary'}
          width="100%"
          icon={isSaved ? <CheckCircle className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
        />
      </AstryxCard>

      {/* Quick Launch Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={openDashboard}
          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left space-y-1 transition group"
        >
          <BookOpen className="w-4 h-4 text-blue-500" />
          <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">Reading</div>
          <p className="text-[10px] text-slate-400">{t('popup.readingDesc')}</p>
        </button>

        <button
          onClick={openDashboard}
          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left space-y-1 transition group"
        >
          <Headphones className="w-4 h-4 text-purple-500" />
          <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">Listening</div>
          <p className="text-[10px] text-slate-400">{t('popup.listeningDesc')}</p>
        </button>

        <button
          onClick={openDashboard}
          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left space-y-1 transition group"
        >
          <PenTool className="w-4 h-4 text-rose-500" />
          <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">AST Writing</div>
          <p className="text-[10px] text-slate-400">{t('popup.writingDesc')}</p>
        </button>

        <button
          onClick={openDashboard}
          className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 text-left space-y-1 transition group"
        >
          <Mic className="w-4 h-4 text-amber-500" />
          <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600">Speaking</div>
          <p className="text-[10px] text-slate-400">{t('popup.speakingDesc')}</p>
        </button>
      </div>

      {/* Open Full Dashboard Link */}
      <button
        onClick={openDashboard}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition active:scale-98"
      >
        <span>{t('popup.openDashboard')}</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </button>
      <p className="text-center text-[10px] text-slate-400" aria-label={t('popup.privacyNote')}>
        {t('popup.privacyNote')}
      </p>
    </div>
  );
};

export const PopupApp: React.FC = () => {
  return (
    <I18nProvider>
      <PopupContent />
    </I18nProvider>
  );
};
