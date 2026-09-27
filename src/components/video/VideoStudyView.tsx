import React, { useState } from "react";
import { Button } from "@astryxdesign/core";
import {
  BookOpenCheck,
  Captions,
  Headphones,
  Mic2,
  PenLine,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "../../i18n/i18nContext";
import { createVideoLesson, VideoLesson } from "../../video/videoLesson";

export const VideoStudyView: React.FC = () => {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [transcript, setTranscript] = useState("");
  const [lesson, setLesson] = useState<VideoLesson | null>(null);
  const [error, setError] = useState("");

  const generate = () => {
    try {
      setLesson(createVideoLesson(transcript, title || t("video.untitled")));
      setError("");
    } catch {
      setLesson(null);
      setError(t("video.tooShort"));
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="rounded-3xl bg-gradient-to-br from-sky-950 via-indigo-950 to-slate-950 p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 text-sky-300 font-semibold">
          <Captions />
          {t("video.eyebrow")}
        </div>
        <h1 className="mt-3 text-3xl font-black">{t("video.title")}</h1>
        <p className="mt-2 max-w-3xl text-slate-300">{t("video.subtitle")}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="w-4" />
          {t("video.private")}
        </div>
      </header>

      <section className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4">
          <label className="block font-semibold">
            {t("video.videoTitle")}
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("video.titlePlaceholder")}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3"
            />
          </label>
          <label className="block font-semibold">
            {t("video.transcript")}
            <textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder={t("video.transcriptPlaceholder")}
              rows={10}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-transparent p-3 font-normal"
            />
          </label>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-slate-500">
              {transcript.match(/[A-Za-z]+/g)?.length ?? 0} {t("common.words")}
            </span>
            <Button
              label={t("video.generate")}
              onClick={generate}
              variant="primary"
            >
              {t("video.generate")}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-sm font-semibold text-rose-600">
              {error}
            </p>
          )}
        </div>
        <aside className="rounded-2xl bg-sky-50 dark:bg-sky-950/30 p-6">
          <h2 className="font-bold text-lg">{t("video.how")}</h2>
          <ol className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <li>1. {t("video.step1")}</li>
            <li>2. {t("video.step2")}</li>
            <li>3. {t("video.step3")}</li>
          </ol>
        </aside>
      </section>

      {lesson && (
        <section aria-label={t("video.lesson")} className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
              {lesson.wordCount} {t("common.words")}
            </span>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
              ≈ {lesson.estimatedMinutes} {t("common.minutes")}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <article className="rounded-2xl border bg-white dark:bg-slate-800 p-6">
              <h2 className="flex gap-2 font-bold">
                <Headphones />
                {t("video.cloze")}
              </h2>
              <ol className="mt-4 space-y-3">
                {lesson.cloze.map((item, index) => (
                  <li key={item.answer}>
                    {index + 1}. {item.sentence}
                    <details className="text-sm text-indigo-600">
                      <summary>{t("video.answer")}</summary>
                      {item.answer}
                    </details>
                  </li>
                ))}
              </ol>
            </article>
            <article className="rounded-2xl border bg-white dark:bg-slate-800 p-6">
              <h2 className="flex gap-2 font-bold">
                <BookOpenCheck />
                {t("video.vocabulary")}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {lesson.vocabulary.map((word) => (
                  <span
                    key={word}
                    className="rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-2"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </article>
            <article className="rounded-2xl border bg-white dark:bg-slate-800 p-6">
              <h2 className="flex gap-2 font-bold">
                <Mic2 />
                {t("video.speaking")}
              </h2>
              <ul className="mt-4 list-disc pl-5 space-y-2">
                {lesson.speakingPrompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </article>
            <article className="rounded-2xl border bg-white dark:bg-slate-800 p-6">
              <h2 className="flex gap-2 font-bold">
                <PenLine />
                {t("video.writing")}
              </h2>
              <p className="mt-4">{lesson.writingPrompt}</p>
            </article>
          </div>
        </section>
      )}
    </div>
  );
};
