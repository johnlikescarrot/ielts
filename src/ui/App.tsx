import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import {
  EMPTY_DATA,
  type AppData,
  type Language,
  type Rating,
  type Skill,
} from "../lib/model";
import { exportData, parseBackup } from "../lib/backup";
import { isDue, scheduleReview } from "../lib/scheduler";
import {
  addStudyDate,
  createCard,
  currentStreak,
  logSession,
  minutesToday,
  transcriptScore,
  wordCount,
} from "../lib/study";
import { loadData, readActiveSelection, saveData } from "../platform/storage";
import {
  getCopy,
  LISTENING_SENTENCE,
  READING_OPTIONS,
  READING_PASSAGE,
  skillLabel,
  SPEAKING_SENTENCE,
  WRITING_PROMPT,
} from "./content";

type View = "today" | "practice" | "review" | "library" | "settings";

type Capture = {
  text: string;
  context: string;
  title: string;
  url: string;
  back: string;
};

const navIcons: Record<View, string> = {
  today: "⌂",
  practice: "◎",
  review: "↻",
  library: "▤",
  settings: "⚙",
};

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function previousDayKeys(now: Date, count = 30): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - index - 1);
    return dayKey(date);
  });
}

export function App() {
  const initialHash = location.hash.replace("#/", "") as View;
  const [view, setView] = useState<View>(
    initialHash === "settings" ? "settings" : "today",
  );
  const [data, setData] = useState<AppData>(structuredClone(EMPTY_DATA));
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const copy = getCopy(data.settings.language);

  useEffect(() => {
    void loadData().then((loaded) => {
      setData(loaded);
      setReady(true);
    });
  }, []);

  const updateData = (updater: (current: AppData) => AppData) => {
    setData((current) => {
      const next = updater(current);
      void saveData(next);
      return next;
    });
  };

  const navigate = (next: View) => {
    setView(next);
    location.hash = `/${next}`;
  };

  if (!ready)
    return <main className="loading">Preparing your private study space…</main>;

  return (
    <div
      className={`app-shell ${data.settings.reduceMotion ? "reduce-motion" : ""}`}
    >
      <header className="topbar">
        <button
          className="brand"
          onClick={() => navigate("today")}
          aria-label="IELTS Forge home"
        >
          <span className="brand-mark">F</span>
          <span>
            <b>IELTS Forge</b>
            <small>{copy.private}</small>
          </span>
        </button>
        <span className="privacy-pill">
          <i /> {copy.noLogin}
        </span>
      </header>

      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}

      <main className="content">
        {view === "today" && (
          <Today
            data={data}
            navigate={navigate}
            updateData={updateData}
            setNotice={setNotice}
          />
        )}
        {view === "practice" && (
          <Practice data={data} updateData={updateData} setNotice={setNotice} />
        )}
        {view === "review" && (
          <Review data={data} updateData={updateData} navigate={navigate} />
        )}
        {view === "library" && <Library data={data} updateData={updateData} />}
        {view === "settings" && (
          <SettingsView
            data={data}
            updateData={updateData}
            setNotice={setNotice}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Primary navigation">
        {(["today", "practice", "review", "library", "settings"] as View[]).map(
          (item) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => navigate(item)}
            >
              <span>{navIcons[item]}</span>
              {copy[item]}
            </button>
          ),
        )}
      </nav>
    </div>
  );
}

function Today({
  data,
  navigate,
  updateData,
  setNotice,
}: {
  data: AppData;
  navigate: (view: View) => void;
  updateData: (updater: (current: AppData) => AppData) => void;
  setNotice: (notice: string) => void;
}) {
  const copy = getCopy(data.settings.language);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const minutes = minutesToday(data, start.getTime(), end.getTime());
  const progress = Math.min(
    100,
    Math.round((minutes / data.settings.dailyGoalMinutes) * 100),
  );
  const due = data.cards.filter((card) =>
    isDue(card.review, now.getTime()),
  ).length;
  const streak = currentStreak(
    data.streakDates,
    dayKey(now),
    previousDayKeys(now),
  );
  const [capture, setCapture] = useState<Capture | null>(null);

  const beginCapture = async () => {
    try {
      const result = await readActiveSelection();
      if (!result.text) return setNotice(copy.noSelection);
      setCapture({ ...result, back: "" });
      setNotice(copy.captured);
    } catch {
      setNotice(copy.noSelection);
    }
  };

  const saveCapture = () => {
    if (!capture) return;
    const nowMs = Date.now();
    const card = createCard(
      {
        front: capture.text,
        back: capture.back,
        context: capture.context,
        sourceTitle: capture.title,
        sourceUrl: capture.url,
      },
      nowMs,
      crypto.randomUUID(),
    );
    updateData((current) => ({ ...current, cards: [card, ...current.cards] }));
    setCapture(null);
    setNotice(copy.saved);
  };

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">{copy.today.toUpperCase()}</p>
          <h1>{copy.greeting}</h1>
        </div>
        <div className="streak">
          <b>{streak}</b>
          <span>🔥 {copy.streak}</span>
        </div>
      </section>

      <section className="goal-card">
        <div className="goal-row">
          <span>{copy.goal}</span>
          <b>
            {minutes} / {data.settings.dailyGoalMinutes} {copy.minutes}
          </b>
        </div>
        <ProgressBar
          label={copy.goal}
          value={progress}
          isLabelHidden
          variant={progress >= 100 ? "success" : "accent"}
        />
        <small>
          {progress >= 100
            ? copy.goalReached
            : `${data.settings.dailyGoalMinutes - minutes} ${copy.minutes}`}
        </small>
      </section>

      <section className="action-grid">
        <article className="feature-card accent-card">
          <span className="feature-icon">↻</span>
          <div>
            <h2>{copy.review}</h2>
            <p>
              <strong>{due}</strong> {copy.due}
            </p>
          </div>
          <Button
            label={copy.startReview}
            variant="primary"
            width="100%"
            onClick={() => navigate("review")}
            isDisabled={due === 0}
          />
        </article>
        <article className="feature-card">
          <span className="feature-icon">◎</span>
          <div>
            <h2>{copy.quickPractice}</h2>
            <p>{copy.quickHint}</p>
          </div>
          <Button
            label={copy.practice}
            variant="secondary"
            width="100%"
            onClick={() => navigate("practice")}
          />
        </article>
      </section>

      <section className="capture-card">
        <div>
          <p className="eyebrow">WEB → MEMORY</p>
          <h2>{copy.capture}</h2>
          <p>{copy.captureHint}</p>
        </div>
        <Button
          label={copy.capture}
          variant="secondary"
          onClick={() => void beginCapture()}
        />
      </section>

      {capture && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={copy.capture}
          >
            <button
              className="close"
              onClick={() => setCapture(null)}
              aria-label="Close"
            >
              ×
            </button>
            <p className="eyebrow">{copy.captured}</p>
            <h2>“{capture.text}”</h2>
            <label>
              {copy.back}
              <textarea
                value={capture.back}
                onChange={(event) =>
                  setCapture({ ...capture, back: event.target.value })
                }
                autoFocus
              />
            </label>
            <label>
              {copy.context}
              <textarea
                value={capture.context}
                onChange={(event) =>
                  setCapture({ ...capture, context: event.target.value })
                }
              />
            </label>
            <Button
              label={copy.saveCard}
              variant="primary"
              width="100%"
              onClick={saveCapture}
              isDisabled={!capture.back.trim()}
            />
          </section>
        </div>
      )}
    </>
  );
}

function Practice({
  data,
  updateData,
  setNotice,
}: {
  data: AppData;
  updateData: (updater: (current: AppData) => AppData) => void;
  setNotice: (notice: string) => void;
}) {
  const copy = getCopy(data.settings.language);
  const [skill, setSkill] = useState<Skill>("listening");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState("");
  const [recordingUrl, setRecordingUrl] = useState("");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);

  const speak = (text: string) => {
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.rate = 0.9;
    speechSynthesis.speak(utterance);
  };
  const finish = (selectedSkill: Skill, score?: number) => {
    const now = Date.now();
    const session = logSession(
      selectedSkill,
      5,
      now,
      crypto.randomUUID(),
      score,
    );
    updateData((current) => ({
      ...current,
      sessions: [session, ...current.sessions],
      streakDates: addStudyDate(current.streakDates, dayKey(new Date(now))),
    }));
    setNotice(copy.saved);
  };
  const selectSkill = (next: Skill) => {
    setSkill(next);
    setAnswer("");
    setResult("");
  };
  const checkListening = () => {
    const score = transcriptScore(LISTENING_SENTENCE, answer);
    setResult(`${score}% ${copy.accuracy}`);
    finish("listening", score);
  };
  const checkReading = (index: number) => {
    const correct = index === 1;
    setResult(correct ? copy.correct : copy.tryAgain);
    if (correct) finish("reading", 100);
  };
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks.current = [];
    const next = new MediaRecorder(stream);
    next.ondataavailable = (event) => chunks.current.push(event.data);
    next.onstop = () => {
      setRecordingUrl(
        URL.createObjectURL(new Blob(chunks.current, { type: "audio/webm" })),
      );
      stream.getTracks().forEach((track) => track.stop());
    };
    next.start();
    recorder.current = next;
  };
  const stopRecording = () => {
    recorder.current?.stop();
    recorder.current = null;
  };

  return (
    <section>
      <p className="eyebrow">ACTIVE RETRIEVAL</p>
      <h1>{copy.quickPractice}</h1>
      <p className="lead">{copy.quickHint}</p>
      <div className="skill-tabs">
        {(["listening", "reading", "writing", "speaking"] as Skill[]).map(
          (item) => (
            <button
              key={item}
              className={skill === item ? "active" : ""}
              onClick={() => selectSkill(item)}
            >
              {skillLabel(copy, item)}
            </button>
          ),
        )}
      </div>
      <article className="drill-card">
        {skill === "listening" && (
          <>
            <span className="drill-number">01 · {copy.listening}</span>
            <h2>{copy.listenPrompt}</h2>
            <div className="sound-wave">▂▅▇▃▆▂▇▅▃▆▂▅</div>
            <Button
              label={copy.play}
              variant="secondary"
              onClick={() => speak(LISTENING_SENTENCE)}
            />
            <label>
              {copy.answer}
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />
            </label>
            <Button
              label={copy.check}
              variant="primary"
              onClick={checkListening}
              isDisabled={!answer.trim()}
            />
            {result && <p className="result">{result}</p>}
          </>
        )}
        {skill === "reading" && (
          <>
            <span className="drill-number">02 · {copy.reading}</span>
            <h2>{copy.readingPrompt}</h2>
            <blockquote>{READING_PASSAGE}</blockquote>
            <p className="question">What is the passage’s main claim?</p>
            {READING_OPTIONS.map((option, index) => (
              <button
                className="option"
                key={option}
                onClick={() => checkReading(index)}
              >
                {String.fromCharCode(65 + index)}. {option}
              </button>
            ))}
            {result && <p className="result">{result}</p>}
          </>
        )}
        {skill === "writing" && (
          <>
            <span className="drill-number">03 · {copy.writing}</span>
            <h2>{copy.writingPrompt}</h2>
            <blockquote>{WRITING_PROMPT}</blockquote>
            <label>
              <textarea
                className="writing-area"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your position…"
              />
            </label>
            <div className="writing-footer">
              <span>
                {wordCount(answer)} {copy.wordCount}
              </span>
              <Button
                label={copy.complete}
                variant="primary"
                onClick={() => finish("writing")}
                isDisabled={wordCount(answer) < 20}
              />
            </div>
          </>
        )}
        {skill === "speaking" && (
          <>
            <span className="drill-number">04 · {copy.speaking}</span>
            <h2>{copy.speakingPrompt}</h2>
            <blockquote>{SPEAKING_SENTENCE}</blockquote>
            <Button
              label={copy.play}
              variant="secondary"
              onClick={() => speak(SPEAKING_SENTENCE)}
            />{" "}
            {!recorder.current ? (
              <Button
                label={copy.record}
                variant="primary"
                onClick={() => void startRecording()}
              />
            ) : (
              <Button
                label={copy.stop}
                variant="destructive"
                onClick={stopRecording}
              />
            )}
            {recordingUrl && (
              <>
                <audio controls src={recordingUrl} />
                <p>{copy.selfRate}</p>
                <div className="rating-row">
                  {[copy.again, copy.hard, copy.good, copy.easy].map(
                    (label, index) => (
                      <button
                        key={label}
                        onClick={() => finish("speaking", (index + 1) * 25)}
                      >
                        {index + 1}
                        <small>{label}</small>
                      </button>
                    ),
                  )}
                </div>
              </>
            )}
          </>
        )}
      </article>
    </section>
  );
}

function Review({
  data,
  updateData,
  navigate,
}: {
  data: AppData;
  updateData: (updater: (current: AppData) => AppData) => void;
  navigate: (view: View) => void;
}) {
  const copy = getCopy(data.settings.language);
  const [revealed, setRevealed] = useState(false);
  const due = useMemo(
    () =>
      data.cards
        .filter((card) => isDue(card.review, Date.now()))
        .sort((a, b) => a.review.dueAt - b.review.dueAt),
    [data.cards],
  );
  const card = due[0];
  const rate = useCallback(
    (rating: Rating) => {
      if (!card) return;
      const now = Date.now();
      updateData((current) => ({
        ...current,
        cards: current.cards.map((item) =>
          item.id === card.id
            ? { ...item, review: scheduleReview(item.review, rating, now) }
            : item,
        ),
        sessions: [
          logSession("reading", 1, now, crypto.randomUUID()),
          ...current.sessions,
        ],
        streakDates: addStudyDate(current.streakDates, dayKey(new Date(now))),
      }));
      setRevealed(false);
    },
    [card, updateData],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      if (event.code === "Space" && card) {
        event.preventDefault();
        setRevealed(true);
      }
      const rating = Number(event.key) as Rating;
      if (revealed && rating >= 1 && rating <= 4) rate(rating);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [card, rate, revealed]);

  if (!card)
    return (
      <section className="empty-state">
        <div>✓</div>
        <h1>{copy.emptyReview}</h1>
        <p>{copy.emptyReviewHint}</p>
        <Button
          label={copy.practice}
          variant="primary"
          onClick={() => navigate("practice")}
        />
      </section>
    );
  return (
    <section>
      <div className="review-head">
        <div>
          <p className="eyebrow">SPACED RETRIEVAL</p>
          <h1>{copy.review}</h1>
        </div>
        <span>
          {due.length} {copy.due}
        </span>
      </div>
      <article className={`flashcard ${revealed ? "revealed" : ""}`}>
        <p className="source-line">{card.sourceTitle || copy.source}</p>
        <h2>{card.front}</h2>
        {card.context && <p className="card-context">{card.context}</p>}
        {revealed && (
          <div className="card-answer">
            <span>{copy.back}</span>
            <p>{card.back}</p>
          </div>
        )}
      </article>
      {!revealed ? (
        <Button
          label={copy.reveal}
          variant="primary"
          width="100%"
          onClick={() => setRevealed(true)}
        />
      ) : (
        <div className="rating-row">
          {([copy.again, copy.hard, copy.good, copy.easy] as const).map(
            (label, index) => (
              <button key={label} onClick={() => rate((index + 1) as Rating)}>
                <b>{index + 1}</b>
                <small>{label}</small>
              </button>
            ),
          )}
        </div>
      )}
      <p className="shortcut-hint">Keyboard: Space to reveal · 1–4 to rate</p>
    </section>
  );
}

function Library({
  data,
  updateData,
}: {
  data: AppData;
  updateData: (updater: (current: AppData) => AppData) => void;
}) {
  const copy = getCopy(data.settings.language);
  return (
    <section>
      <div className="review-head">
        <div>
          <p className="eyebrow">PERSONAL CORPUS</p>
          <h1>{copy.library}</h1>
        </div>
        <span>
          {data.cards.length} {copy.cards}
        </span>
      </div>
      {data.cards.length === 0 ? (
        <div className="empty-list">{copy.libraryEmpty}</div>
      ) : (
        <div className="card-list">
          {data.cards.map((card) => (
            <article key={card.id}>
              <div>
                <h3>{card.front}</h3>
                <p>{card.back}</p>
                <small>{card.sourceTitle}</small>
              </div>
              <button
                aria-label="Delete card"
                onClick={() =>
                  updateData((current) => ({
                    ...current,
                    cards: current.cards.filter((item) => item.id !== card.id),
                  }))
                }
              >
                ×
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsView({
  data,
  updateData,
  setNotice,
}: {
  data: AppData;
  updateData: (updater: (current: AppData) => AppData) => void;
  setNotice: (notice: string) => void;
}) {
  const copy = getCopy(data.settings.language);
  const [confirming, setConfirming] = useState(false);
  const patch = (settings: Partial<AppData["settings"]>) =>
    updateData((current) => ({
      ...current,
      settings: { ...current.settings, ...settings },
    }));
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([exportData(data)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `ielts-forge-${dayKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const upload = (file?: File) => {
    if (!file) return;
    void file
      .text()
      .then((raw) => {
        updateData(() => parseBackup(raw));
        setNotice(copy.saved);
      })
      .catch(() => setNotice("Invalid backup"));
  };
  const erase = () => {
    if (!confirming) return setConfirming(true);
    updateData(() => structuredClone(EMPTY_DATA));
    setConfirming(false);
  };
  return (
    <section>
      <p className="eyebrow">LOCAL FIRST</p>
      <h1>{copy.settings}</h1>
      <div className="settings-card">
        <label>
          {copy.language}
          <select
            value={data.settings.language}
            onChange={(e) => patch({ language: e.target.value as Language })}
          >
            <option value="en">English</option>
            <option value="vi">Tiếng Việt</option>
          </select>
        </label>
        <label>
          {copy.dailyGoal}
          <input
            type="number"
            min="5"
            max="180"
            value={data.settings.dailyGoalMinutes}
            onChange={(e) =>
              patch({ dailyGoalMinutes: Number(e.target.value) })
            }
          />
        </label>
        <label>
          {copy.targetBand}
          <select
            value={data.settings.targetBand}
            onChange={(e) => patch({ targetBand: Number(e.target.value) })}
          >
            {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((band) => (
              <option key={band}>{band}</option>
            ))}
          </select>
        </label>
        <label>
          {copy.examDate}
          <input
            type="date"
            value={data.settings.examDate}
            onChange={(e) => patch({ examDate: e.target.value })}
          />
        </label>
      </div>
      <div className="settings-card">
        <h2>{copy.dataPrivacy}</h2>
        <p>{copy.privacyBody}</p>
        <div className="button-pair">
          <Button label={copy.export} variant="secondary" onClick={download} />
          <label className="import-button">
            {copy.import}
            <input
              type="file"
              accept="application/json"
              onChange={(e) => upload(e.target.files?.[0])}
            />
          </label>
        </div>
        <button className="danger-link" onClick={erase}>
          {confirming ? copy.confirmDelete : copy.deleteAll}
        </button>
      </div>
      <div className="settings-card research">
        <h2>{copy.openSource}</h2>
        <p>Retrieval practice · spacing · interleaving · immediate feedback</p>
        <a
          href="https://github.com/johnlikescarrot/ielts/blob/main/docs/RESEARCH.md"
          target="_blank"
          rel="noreferrer"
        >
          {copy.citations} ↗
        </a>
      </div>
    </section>
  );
}
