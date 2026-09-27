import React, { useState, useEffect } from 'react';
import { INITIAL_VOCABULARY } from '../../data/vocabularyBank';
import { VocabularyItem, SRSCard } from '../../types';
import { getDueCards, getDeckSummary, reviewCard, initializeDeckWithVocabulary } from '../../srs/srsManager';
import { storageService } from '../../storage/storageService';
import { useI18n } from '../../i18n/i18nContext';
import { Badge } from '../common/Badge';
import {
  Layers,
  Volume2,
  RotateCw,
  Search,
  Plus,
  Brain,
  CheckCircle,
  Sparkles
} from 'lucide-react';

export const VocabularySRSView: React.FC = () => {
  const { language, t } = useI18n();
  const [vocabList, setVocabList] = useState<VocabularyItem[]>(INITIAL_VOCABULARY);
  const [srsCards, setSrsCards] = useState<SRSCard[]>([]);
  const [activeTab, setActiveTab] = useState<'flashcards' | 'bank' | 'quiz'>('flashcards');

  // Flashcard review state
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  // Mini Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState<boolean>(false);
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null);

  // Custom Word Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newDefEn, setNewDefEn] = useState('');
  const [newDefVi, setNewDefVi] = useState('');
  const [newExample, setNewExample] = useState('');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    const custom = await storageService.getCustomVocabulary();
    const combined = [...INITIAL_VOCABULARY, ...custom];
    setVocabList(combined);

    const savedCards = await storageService.getSRSCards();
    const initialized = initializeDeckWithVocabulary(combined, savedCards);
    setSrsCards(initialized);
    await storageService.saveSRSCards(initialized);
  };

  const dueCards = getDueCards(srsCards);
  const deckSummary = getDeckSummary(srsCards);

  const currentDueCard = dueCards[reviewIndex];
  const currentVocabItem: VocabularyItem | undefined =
    currentDueCard ? vocabList.find(v => v.id === currentDueCard.wordId) : vocabList[0];

  const handleGrade = async (grade: number) => {
    if (!currentDueCard) return;

    const updated = reviewCard(currentDueCard, currentDueCard.wordId, grade);
    await storageService.updateSingleSRSCard(updated);

    const newSrsCards = srsCards.map(c => c.wordId === updated.wordId ? updated : c);
    setSrsCards(newSrsCards);
    setIsFlipped(false);

    if (reviewIndex < dueCards.length - 1) {
      setReviewIndex(prev => prev + 1);
    } else {
      setReviewIndex(0);
    }
  };

  const speakWord = (word: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-GB';
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddCustomWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newDefEn.trim()) return;

    const customItem: VocabularyItem = {
      id: `custom_${Date.now()}`,
      word: newWord.trim().toLowerCase(),
      phonetic: newPhonetic.trim() || '/.../',
      partOfSpeech: 'noun',
      definitionEn: newDefEn.trim(),
      definitionVi: newDefVi.trim() || newDefEn.trim(),
      example: newExample.trim() || `The word "${newWord.trim()}" is useful in IELTS academic writing.`,
      collocations: [],
      synonyms: [],
      topic: 'Custom',
      bandScore: 8.0,
      cefrLevel: 'C1',
      isAWL: true,
    };

    await storageService.addCustomVocabulary(customItem);
    setShowAddModal(false);
    setNewWord('');
    setNewPhonetic('');
    setNewDefEn('');
    setNewDefVi('');
    setNewExample('');
    await loadCards();
  };

  // Filtered Vocab Bank
  const topics = Array.from(new Set(vocabList.map(v => v.topic)));
  const filteredVocab = vocabList.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definitionEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.definitionVi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTopic = selectedTopic === 'all' || item.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  // Quiz helper
  const quizVocab = vocabList[quizIndex % vocabList.length];
  // Generate 3 wrong options
  const otherDefs = vocabList.filter(v => v.id !== quizVocab.id).map(v => language === 'vi' ? v.definitionVi : v.definitionEn);
  const quizOptions = [
    language === 'vi' ? quizVocab.definitionVi : quizVocab.definitionEn,
    otherDefs[0] || 'Alternative definition 1',
    otherDefs[1] || 'Alternative definition 2',
    otherDefs[2] || 'Alternative definition 3',
  ].sort(() => 0.5 - Math.random());

  const handleQuizAnswer = (option: string) => {
    if (quizAnswered) return;
    setSelectedQuizOption(option);
    setQuizAnswered(true);
    const correctDef = language === 'vi' ? quizVocab.definitionVi : quizVocab.definitionEn;
    if (option === correctDef) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuizQuestion = () => {
    setQuizIndex(prev => prev + 1);
    setQuizAnswered(false);
    setSelectedQuizOption(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('vocab.title')}
            </h1>
            <Badge variant="primary" size="sm">
              SuperMemo SM-2
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('vocab.subtitle')}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'flashcards' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            SRS Deck ({deckSummary.dueToday} Due)
          </button>
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'bank' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Word Bank ({vocabList.length})
          </button>
          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'quiz' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Mini Quiz
          </button>
        </div>
      </div>

      {/* Deck Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">{t('vocab.dueToday')}</span>
            <div className="text-xl font-black text-rose-600 mt-0.5">{deckSummary.dueToday}</div>
          </div>
          <Brain className="w-5 h-5 text-rose-500 opacity-80" />
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">{t('vocab.learning')}</span>
            <div className="text-xl font-black text-amber-500 mt-0.5">{deckSummary.learning}</div>
          </div>
          <Sparkles className="w-5 h-5 text-amber-500 opacity-80" />
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">{t('vocab.reviewing')}</span>
            <div className="text-xl font-black text-indigo-600 mt-0.5">{deckSummary.reviewing}</div>
          </div>
          <RotateCw className="w-5 h-5 text-indigo-500 opacity-80" />
        </div>
        <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">{t('vocab.mastered')}</span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{deckSummary.mastered}</div>
          </div>
          <CheckCircle className="w-5 h-5 text-emerald-500 opacity-80" />
        </div>
      </div>

      {/* Tab 1: SRS Flashcard Review Deck */}
      {activeTab === 'flashcards' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {currentVocabItem && dueCards.length > 0 ? (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Review Card {reviewIndex + 1} of {dueCards.length}</span>
                <span>Interval: {currentDueCard?.interval || 0}d | Reps: {currentDueCard?.repetition || 0}</span>
              </div>

              {/* Flip Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="cursor-pointer min-h-[340px] bg-white dark:bg-slate-800 rounded-3xl border-2 border-indigo-100 dark:border-slate-700 shadow-lg p-8 flex flex-col justify-between hover:border-indigo-300 transition-all text-center relative overflow-hidden"
              >
                {/* Top tags */}
                <div className="flex items-center justify-between">
                  <Badge variant="purple" size="sm">
                    {currentVocabItem.topic}
                  </Badge>
                  <div className="flex items-center space-x-1.5">
                    <Badge variant="neutral" size="sm">
                      CEFR {currentVocabItem.cefrLevel}
                    </Badge>
                    <Badge variant="primary" size="sm">
                      Band {currentVocabItem.bandScore.toFixed(1)}
                    </Badge>
                  </div>
                </div>

                {/* Card Front / Back */}
                {!isFlipped ? (
                  <div className="space-y-4 my-auto">
                    <div className="flex items-center justify-center space-x-3">
                      <h2 className="text-4xl font-black text-slate-900 dark:text-white capitalize">
                        {currentVocabItem.word}
                      </h2>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          speakWord(currentVocabItem.word);
                        }}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-full transition"
                      >
                        <Volume2 className="w-6 h-6" />
                      </button>
                    </div>
                    <p className="font-mono text-sm text-slate-500 dark:text-slate-400">
                      {currentVocabItem.phonetic} • <span className="italic">{currentVocabItem.partOfSpeech}</span>
                    </p>
                    <p className="text-xs text-indigo-500 font-semibold pt-4">
                      {t('vocab.flipCard')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 my-auto text-left">
                    <div className="text-center pb-2 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                        {currentVocabItem.word}
                      </h3>
                      <p className="text-xs text-slate-500">{currentVocabItem.phonetic}</p>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">English:</span>
                        <p className="text-slate-800 dark:text-slate-100">{currentVocabItem.definitionEn}</p>
                      </div>

                      <div>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">Tiếng Việt:</span>
                        <p className="text-slate-800 dark:text-slate-100 font-medium">{currentVocabItem.definitionVi}</p>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">Example:</span>
                        <p className="italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          "{currentVocabItem.example}"
                        </p>
                      </div>

                      {currentVocabItem.collocations.length > 0 && (
                        <div>
                          <span className="font-bold text-slate-700 dark:text-slate-300">Collocations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentVocabItem.collocations.map((c, i) => (
                              <span key={i} className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                                {c}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  IELTS Slayer SM-2 Algorithm
                </div>
              </div>

              {/* SM-2 Action Buttons */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleGrade(1)}
                  className="py-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs transition active:scale-95"
                >
                  {t('vocab.again')}
                </button>
                <button
                  onClick={() => handleGrade(3)}
                  className="py-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold rounded-xl text-xs transition active:scale-95"
                >
                  {t('vocab.hard')}
                </button>
                <button
                  onClick={() => handleGrade(4)}
                  className="py-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold rounded-xl text-xs transition active:scale-95"
                >
                  {t('vocab.good')}
                </button>
                <button
                  onClick={() => handleGrade(5)}
                  className="py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs transition active:scale-95"
                >
                  {t('vocab.easy')}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-12 text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                All Cards Reviewed for Today!
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Great job! You have completed all due spaced repetition reviews. Check the Word Bank or test yourself in Mini Quiz mode.
              </p>
              <button
                onClick={() => setActiveTab('bank')}
                className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow text-xs hover:bg-indigo-500 transition"
              >
                Explore Word Bank
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Word Bank Explorer */}
      {activeTab === 'bank' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('vocab.searchVocab')}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="all">{t('common.filterAll')}</option>
                {topics.map((tp, idx) => (
                  <option key={idx} value={tp}>{tp}</option>
                ))}
              </select>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t('vocab.addCustom')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVocab.map(item => (
              <div
                key={item.id}
                className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">{item.word}</h3>
                    <button onClick={() => speakWord(item.word)} className="text-indigo-600 hover:opacity-75">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <Badge variant="primary" size="sm">Band {item.bandScore.toFixed(1)}</Badge>
                </div>

                <p className="text-xs font-mono text-slate-400">{item.phonetic} • {item.partOfSpeech}</p>

                <div className="text-xs space-y-1">
                  <p className="text-slate-700 dark:text-slate-300">{item.definitionEn}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium">{item.definitionVi}</p>
                </div>

                <p className="text-xs italic text-slate-500 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg">
                  "{item.example}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Mini Quiz */}
      {activeTab === 'quiz' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-6 text-center">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>{t('vocab.miniQuiz')}</span>
            <span>Score: {quizScore}</span>
          </div>

          <div className="space-y-2">
            <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">What is the meaning of:</span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white capitalize">{quizVocab.word}</h2>
            <p className="text-xs font-mono text-slate-400">{quizVocab.phonetic}</p>
          </div>

          <div className="space-y-2.5 text-left">
            {quizOptions.map((opt, idx) => {
              const correctDef = language === 'vi' ? quizVocab.definitionVi : quizVocab.definitionEn;
              const isSelected = selectedQuizOption === opt;
              const isCorrectOpt = opt === correctDef;

              let btnStyle = 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200';
              if (quizAnswered) {
                if (isCorrectOpt) btnStyle = 'bg-emerald-100 dark:bg-emerald-950 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                else if (isSelected) btnStyle = 'bg-rose-100 dark:bg-rose-950 border-rose-500 text-rose-900 dark:text-rose-200';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleQuizAnswer(opt)}
                  disabled={quizAnswered}
                  className={`w-full p-3.5 rounded-xl border text-xs text-left transition ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {quizAnswered && (
            <button
              onClick={nextQuizQuestion}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow transition active:scale-95"
            >
              {t('common.next')} Question
            </button>
          )}
        </div>
      )}

      {/* Add Custom Word Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('vocab.addCustom')}
            </h3>

            <form onSubmit={handleAddCustomWord} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Word:</label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. ubiquitous"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Phonetic (optional):</label>
                <input
                  type="text"
                  value={newPhonetic}
                  onChange={(e) => setNewPhonetic(e.target.value)}
                  placeholder="e.g. /juːˈbɪkwɪtəs/"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">English Definition:</label>
                <input
                  type="text"
                  required
                  value={newDefEn}
                  onChange={(e) => setNewDefEn(e.target.value)}
                  placeholder="Definition in English..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Vietnamese Definition:</label>
                <input
                  type="text"
                  value={newDefVi}
                  onChange={(e) => setNewDefVi(e.target.value)}
                  placeholder="Định nghĩa tiếng Việt..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Example sentence:</label>
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  placeholder="Contextual sentence..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
