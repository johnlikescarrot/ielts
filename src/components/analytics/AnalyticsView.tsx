import React, { useState, useEffect } from 'react';
import { TestAttempt } from '../../types';
import { storageService } from '../../storage/storageService';
import { exportDataAsJSON, importDataFromJSON, triggerDownload } from '../../storage/exportImport';
import { useI18n } from '../../i18n/i18nContext';
import { Badge } from '../common/Badge';
import {
  BarChart2,
  Clock,
  CheckCircle,
  Download,
  Upload,
  Trash2,
  Calendar,
  FileText
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { t } = useI18n();
  const [history, setHistory] = useState<TestAttempt[]>([]);
  const [filterSkill, setFilterSkill] = useState<string>('all');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const attempts = await storageService.getTestHistory();
    setHistory(attempts);
  };

  const handleExport = async () => {
    const allData = await storageService.getData();
    const jsonStr = exportDataAsJSON(allData);
    triggerDownload(jsonStr);
    setStatusMessage('Backup JSON exported successfully!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = event.target?.result as string;
        await importDataFromJSON(rawJson);
        await loadHistory();
        setStatusMessage('Backup data successfully restored!');
        setTimeout(() => setStatusMessage(null), 3000);
      } catch (err: any) {
        alert('Failed to import backup: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    if (window.confirm(t('analytics.confirmReset'))) {
      await storageService.resetAll();
      await loadHistory();
      setStatusMessage('All local data cleared.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filterSkill === 'all') return true;
    return item.skill === filterSkill;
  });

  const totalTimeMinutes = Math.round(history.reduce((sum, h) => sum + (h.timeSpentSeconds || 0), 0) / 60);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              {t('analytics.title')}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('analytics.subtitle')}
          </p>
        </div>

        {/* Export / Import buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg text-xs hover:bg-indigo-100 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('common.export')}</span>
          </button>

          <label className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg text-xs hover:bg-slate-200 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5" />
            <span>{t('common.import')}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>

          <button
            onClick={handleClearData}
            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition"
            title={t('analytics.resetData')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">{t('analytics.totalStudyTime')}</span>
            <div className="text-2xl font-black text-indigo-600 mt-0.5">{totalTimeMinutes} {t('common.minutes')}</div>
          </div>
          <Clock className="w-6 h-6 text-indigo-400 opacity-70" />
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">{t('analytics.testsCompleted')}</span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">{history.length}</div>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-400 opacity-70" />
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-medium">{t('dash.dailyStreak')}</span>
            <div className="text-2xl font-black text-amber-500 mt-0.5">3 {t('dash.days')}</div>
          </div>
          <Calendar className="w-6 h-6 text-amber-400 opacity-70" />
        </div>
      </div>

      {/* Practice History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-base text-slate-900 dark:text-white">
            {t('dash.recentAttempts')}
          </h2>

          <select
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-semibold"
          >
            <option value="all">{t('common.filterAll')}</option>
            <option value="reading">Reading</option>
            <option value="listening">Listening</option>
            <option value="writing">Writing</option>
            <option value="speaking">Speaking</option>
            <option value="video-lab">Video Lab</option>
            <option value="shadowing">Shadowing</option>
            <option value="mock-test">Mock Exams</option>
          </select>
        </div>

        {filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Skill</th>
                  <th className="pb-3">Test Title</th>
                  <th className="pb-3">Score / Band</th>
                  <th className="pb-3">Time Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="py-3 text-slate-500 font-mono">
                      {new Date(item.date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Badge variant="primary" size="sm" className="capitalize">
                        {item.skill}
                      </Badge>
                    </td>
                    <td className="py-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      {item.testTitle}
                    </td>
                    <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">
                      Band {item.estimatedBand.toFixed(1)}
                    </td>
                    <td className="py-3 text-slate-500">
                      {Math.round(item.timeSpentSeconds / 60)} {t('common.minutes')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>{t('common.noData')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
