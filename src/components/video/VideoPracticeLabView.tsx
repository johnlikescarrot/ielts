import React, { useMemo, useState } from 'react';
import { Badge } from '../common/Badge';
import { useI18n } from '../../i18n/i18nContext';
import { storageService } from '../../storage/storageService';
import { ASTRYX_REFERENCE } from '../../astryx/astryxIntegration';
import {
  generateVideoPracticePack,
  formatTimestamp,
  VideoPracticePack,
} from '../../video/videoPracticeGenerator';
import {
  BadgeCheck,
  BookOpenCheck,
  Clapperboard,
  ClipboardList,
  Download,
  Headphones,
  Languages,
  Layers,
  Link as LinkIcon,
  MessageCircle,
  PenTool,
  Sparkles,
} from 'lucide-react';

const SAMPLE_TRANSCRIPT = `[00:00] Speaker: Today we analyze how urban gardens improve community resilience and environmental awareness.
[00:11] Speaker: Researchers suggest that local food projects can reduce waste, create social benefits, and support healthier routines.
[00:24] Speaker: However, limited space and funding remain significant challenges for cities that want to expand these initiatives.
[00:37] Speaker: The most successful programs combine education, volunteer participation, and clear policy support.`;

function buildExportBlob(pack: VideoPracticePack): string {
  return JSON.stringify({
    product: 'IELTS Slayer Video Practice Lab',
    exportedAt: new Date().toISOString(),
    pack,
  }, null, 2);
}

export const VideoPracticeLabView: React.FC = () => {
  const { language, t } = useI18n();
  const [title, setTitle] = useState('Urban gardens and resilient cities');
  const [sourceUrl, setSourceUrl] = useState('https://www.youtube.com/watch?v=ielts-demo');
  const [transcript, setTranscript] = useState(SAMPLE_TRANSCRIPT);
  const [pack, setPack] = useState<VideoPracticePack | null>(null);
  const [savedVocabularyCount, setSavedVocabularyCount] = useState(0);

  const wordCount = useMemo(() => transcript.trim().split(/\s+/).filter(Boolean).length, [transcript]);
  const hasTranscript = transcript.trim().length > 0;

  const handleGenerate = () => {
    const nextPack = generateVideoPracticePack({ title, sourceUrl, transcript });
    setPack(nextPack);
    setSavedVocabularyCount(0);
  };

  const handleLoadSample = () => {
    setTitle('Urban gardens and resilient cities');
    setSourceUrl('https://www.bilibili.com/video/BV1IELTSDEMO');
    setTranscript(SAMPLE_TRANSCRIPT);
  };

  const handleSaveVocabulary = async () => {
    if (!pack) return;
    await Promise.all(pack.vocabulary.map(item => storageService.addCustomVocabulary({
      id: `video_${pack.id}_${item.word}`,
      word: item.word,
      phonetic: '/video/',
      partOfSpeech: 'keyword',
      definitionEn: item.definitionEn,
      definitionVi: item.definitionVi,
      example: `Video context: ${pack.summary}`,
      collocations: pack.insights.topTopics.filter(topic => topic !== item.word).slice(0, 3),
      synonyms: [],
      topic: `Video Lab: ${pack.title}`,
      bandScore: item.band,
      cefrLevel: item.cefr === 'C2' ? 'C2' : item.cefr === 'C1' ? 'C1' : 'B2',
      isAWL: item.isAcademic,
    })));
    setSavedVocabularyCount(pack.vocabulary.length);
  };

  const handleExport = () => {
    if (!pack) return;
    const blob = new Blob([buildExportBlob(pack)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pack.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-sky-200 dark:border-sky-900 bg-gradient-to-r from-slate-950 via-indigo-950 to-sky-950 text-white p-6 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-sky-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('video.badge')}</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                <Clapperboard className="w-8 h-8 text-sky-300" />
                {t('video.title')}
              </h1>
              <p className="text-sm text-sky-100 mt-2 leading-relaxed">
                {t('video.subtitle')}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
              <Badge variant="success">{t('video.free')}</Badge>
              <Badge variant="purple">{t('video.noLogin')}</Badge>
              <Badge variant="neutral">{t('video.astryx')}</Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 text-xs text-sky-100 max-w-sm">
            <div className="flex items-center gap-2 font-bold text-white mb-2">
              <BadgeCheck className="w-4 h-4 text-emerald-300" />
              <span>Astryx reference</span>
            </div>
            <p>
              {ASTRYX_REFERENCE.principles.join(' • ')}
            </p>
            <p className="mt-2 text-[10px] text-sky-200 break-all">
              {ASTRYX_REFERENCE.source}
            </p>
          </div>
        </div>
        <div className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <section className="xl:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-indigo-600" />
                {t('video.inputTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t('video.inputHint')}
              </p>
            </div>
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              {t('video.loadSample')}
            </button>
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('video.videoTitle')}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5" />
              {t('video.sourceUrl')}
            </span>
            <input
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://youtube.com/... or https://bilibili.com/..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('video.transcript')}</span>
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              rows={12}
              placeholder={t('video.transcriptPlaceholder')}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
            <span>{wordCount} {t('common.words')}</span>
            <span>{language === 'vi' ? 'Chạy hoàn toàn trên máy' : 'Runs fully offline'}</span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!hasTranscript}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 transition"
          >
            {t('video.generate')}
          </button>
        </section>

        <section className="xl:col-span-7 space-y-4">
          {!pack ? (
            <div className="h-full min-h-[520px] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-8 flex flex-col items-center justify-center text-center space-y-3">
              <Clapperboard className="w-12 h-12 text-slate-300" />
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">{t('video.emptyTitle')}</h2>
              <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                {t('video.emptyDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="primary">{pack.platform.toUpperCase()}</Badge>
                      <Badge variant="neutral">{pack.insights.wordCount} {t('common.words')}</Badge>
                      <Badge variant="purple">AWL {pack.insights.academicWordDensity}%</Badge>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{pack.title}</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{pack.summary}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={handleSaveVocabulary}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {savedVocabularyCount > 0 ? `${savedVocabularyCount} ${t('inspector.saved')}` : t('video.saveVocab')}
                    </button>
                    <button
                      onClick={handleExport}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      JSON
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                    <span className="text-slate-400 font-bold uppercase">Sentences</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{pack.insights.sentenceCount}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3">
                    <span className="text-slate-400 font-bold uppercase">Minutes</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white">{pack.insights.estimatedListeningMinutes}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 col-span-2">
                    <span className="text-slate-400 font-bold uppercase">Topics</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {pack.insights.topTopics.map(topic => <Badge key={topic} variant="neutral">{topic}</Badge>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PracticeCard icon={<Headphones className="w-4 h-4" />} title={t('video.listeningDrills')}>
                  <div className="space-y-3">
                    {pack.listeningQuestions.map(question => (
                      <div key={question.id} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-xs space-y-1">
                        <div className="font-bold text-indigo-600">{formatTimestamp(question.timestampSeconds)} • {question.prompt}</div>
                        <div className="text-slate-800 dark:text-slate-200">{question.sentenceWithBlank}</div>
                        <details className="text-slate-500">
                          <summary className="cursor-pointer font-semibold">{t('common.explanation')}</summary>
                          <p className="mt-1">{language === 'vi' ? question.explanationVi : question.explanationEn}</p>
                        </details>
                      </div>
                    ))}
                  </div>
                </PracticeCard>

                <PracticeCard icon={<BookOpenCheck className="w-4 h-4" />} title={t('video.readingDrills')}>
                  <div className="space-y-3">
                    {pack.readingQuestions.map(question => (
                      <div key={question.id} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-xs space-y-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{question.prompt}</div>
                        <Badge variant={question.answer === 'True' ? 'success' : question.answer === 'False' ? 'warning' : 'neutral'}>
                          {question.answer}
                        </Badge>
                        <p className="text-slate-500">{language === 'vi' ? question.explanationVi : question.explanationEn}</p>
                      </div>
                    ))}
                  </div>
                </PracticeCard>

                <PracticeCard icon={<MessageCircle className="w-4 h-4" />} title={t('video.speakingDrills')}>
                  <div className="space-y-3">
                    {pack.speakingPrompts.map(prompt => (
                      <div key={`${prompt.part}-${prompt.prompt}`} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-xs space-y-1">
                        <div className="font-black text-rose-600">Part {prompt.part}</div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100">{prompt.prompt}</div>
                        <p className="text-slate-500">{prompt.modelStarter}</p>
                      </div>
                    ))}
                  </div>
                </PracticeCard>

                <PracticeCard icon={<PenTool className="w-4 h-4" />} title={t('video.writingTask')}>
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-xs space-y-2">
                    <p className="font-semibold text-slate-800 dark:text-slate-100">{pack.writingTask.prompt}</p>
                    <ul className="list-disc pl-4 text-slate-500 space-y-1">
                      {pack.writingTask.planningAngles.map(angle => <li key={angle}>{angle}</li>)}
                    </ul>
                  </div>
                </PracticeCard>
              </div>

              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Languages className="w-4 h-4 text-indigo-600" />
                  {t('video.vocabTitle')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pack.vocabulary.map(item => (
                    <div key={item.word} className="rounded-xl bg-slate-50 dark:bg-slate-900 p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-slate-900 dark:text-white">{item.word}</span>
                        <Badge variant={item.isAcademic ? 'primary' : 'neutral'}>{item.cefr} • Band {item.band.toFixed(1)}</Badge>
                      </div>
                      <p className="text-slate-500 mt-1">{language === 'vi' ? item.definitionVi : item.definitionEn}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const PracticeCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
    <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
        {icon}
      </span>
      {title}
    </h3>
    {children}
  </div>
);
