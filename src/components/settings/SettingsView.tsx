import React, { useState, useEffect } from "react";
import { UserSettings } from "../../types";
import { storageService, DEFAULT_SETTINGS } from "../../storage/storageService";
import { useI18n } from "../../i18n/i18nContext";
import { Settings, CheckCircle, ShieldCheck, Cpu } from "lucide-react";

export const SettingsView: React.FC = () => {
  const { language, setLanguage, t } = useI18n();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    storageService.getSettings().then((s) => setSettings(s));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await storageService.updateSettings(settings);
    if (settings.language !== language) {
      await setLanguage(settings.language);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-1">
        <div className="flex items-center space-x-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {t("settings.title")}
          </h1>
        </div>
        <p className="text-xs text-slate-500">
          Personalize your IELTS target bands, study preferences, and language.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-semibold flex items-center space-x-2 shadow-xs">
          <CheckCircle className="w-4 h-4" />
          <span>{t("settings.savedSuccess")}</span>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-5 text-xs"
      >
        {/* Target Band */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 dark:text-slate-200">
            {t("settings.targetScore")}: Band {settings.targetBand.toFixed(1)}
          </label>
          <input
            type="range"
            min="5.0"
            max="9.0"
            step="0.5"
            value={settings.targetBand}
            onChange={(e) =>
              setSettings({
                ...settings,
                targetBand: parseFloat(e.target.value),
              })
            }
            className="w-full accent-indigo-600"
          />
        </div>

        {/* Exam Type */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 dark:text-slate-200">
            {t("settings.preferredExam")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, examType: "academic" })}
              className={`p-3 rounded-xl border font-bold text-xs transition ${
                settings.examType === "academic"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              Academic
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, examType: "general" })}
              className={`p-3 rounded-xl border font-bold text-xs transition ${
                settings.examType === "general"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              General Training
            </button>
          </div>
        </div>

        {/* Interface Language */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 dark:text-slate-200">
            {t("settings.language")}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSettings({ ...settings, language: "en" })}
              className={`p-3 rounded-xl border font-bold text-xs transition ${
                settings.language === "en"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              English (UK / US) 🇬🇧
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, language: "vi" })}
              className={`p-3 rounded-xl border font-bold text-xs transition ${
                settings.language === "vi"
                  ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              Tiếng Việt (Vietnamese) 🇻🇳
            </button>
          </div>
        </div>

        {/* Daily Minutes */}
        <div className="space-y-1.5">
          <label className="font-bold text-slate-800 dark:text-slate-200">
            {t("settings.dailyMinutes")}
          </label>
          <input
            type="number"
            min="10"
            max="240"
            step="5"
            value={settings.dailyGoalMinutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                dailyGoalMinutes: parseInt(e.target.value) || 30,
              })
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-md transition text-xs active:scale-98"
        >
          {t("common.save")}
        </button>
      </form>

      {/* Privacy & Engine badges */}
      <div className="p-5 bg-slate-100 dark:bg-slate-800/60 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Free & Privacy-First Architecture</span>
        </div>
        <p className="leading-relaxed">
          IELTS Slayer operates 100% locally on your machine. Zero tracking,
          zero ads, zero user accounts, zero remote analytics. Your test
          responses and flashcard states remain encrypted in local browser
          storage.
        </p>

        <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 pt-2">
          <Cpu className="w-4 h-4 text-indigo-500" />
          <span>Astryx Syntax AST Engine</span>
        </div>
        <p className="leading-relaxed">
          The automated essay evaluation system uses a local Abstract Syntax
          Tree (AST) grammar heuristic. Your writing stays on this device.
        </p>
      </div>
    </div>
  );
};
