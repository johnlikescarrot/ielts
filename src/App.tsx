import { useEffect, useMemo, useState } from "react";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { TextInput } from "@astryxdesign/core/TextInput";
import {
  BookOpen,
  Brain,
  ChevronRight,
  Clock3,
  Flame,
  Headphones,
  Languages,
  LockKeyhole,
  Mic2,
  PenLine,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import {
  addCard,
  dueCards,
  formatClock,
  schedule,
  wordCount,
  type AppData,
  type Language,
  type Rating,
  type Skill,
} from "./core/model";
import { translate, type MessageKey } from "./core/i18n";
import { parseData, serializeData, STORAGE_KEY } from "./core/storage";

type View = "today" | "review" | "practice" | "library" | "settings";
const skills: { id: Skill; icon: typeof Mic2; color: string }[] = [
  { id: "listening", icon: Headphones, color: "#a7d8ff" },
  { id: "reading", icon: BookOpen, color: "#c7b9ff" },
  { id: "writing", icon: PenLine, color: "#ffcb92" },
  { id: "speaking", icon: Mic2, color: "#8ce0c1" },
];

export default function App() {
  const [data, setData] = useState<AppData>(() =>
    parseData(localStorage.getItem(STORAGE_KEY)),
  );
  const [view, setView] = useState<View>("today");
  const [front, setFront] = useState("");
  const [context, setContext] = useState("");
  const t = (key: MessageKey) => translate(data.language, key);
  useEffect(
    () => localStorage.setItem(STORAGE_KEY, serializeData(data)),
    [data],
  );
  useEffect(() => {
    void import("webextension-polyfill")
      .then(async ({ default: browser }) => {
        const stored = await browser.storage.local.get("pendingCapture");
        if (typeof stored.pendingCapture === "string") {
          setFront(stored.pendingCapture);
          await browser.storage.local.remove("pendingCapture");
        }
      })
      .catch(() => undefined);
  }, []);
  const due = useMemo(() => dueCards(data.cards, new Date()), [data.cards]);
  const add = () => {
    const cards = addCard(data.cards, front, context);
    if (cards !== data.cards) {
      setData({ ...data, cards });
      setFront("");
      setContext("");
    }
  };
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => setView("today")}
          aria-label="IELTS Compass home"
        >
          <span className="logo">
            <Target size={20} />
          </span>
          <span>
            <b>IELTS</b>
            <small>COMPASS</small>
          </span>
        </button>
        <nav aria-label="Primary navigation">
          {(["today", "review", "practice", "library"] as View[]).map((id) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => setView(id)}
            >
              {id === "today" ? (
                <Sparkles />
              ) : id === "review" ? (
                <Brain />
              ) : id === "practice" ? (
                <PenLine />
              ) : (
                <BookOpen />
              )}
              <span>{t(id as MessageKey)}</span>
              {id === "review" && due.length > 0 && <em>{due.length}</em>}
            </button>
          ))}
        </nav>
        <div className="side-footer">
          <button
            className={view === "settings" ? "active" : ""}
            onClick={() => setView("settings")}
          >
            <Languages />
            <span>{t("settings")}</span>
          </button>
          <p>
            <LockKeyhole size={13} /> Local only · No account
          </p>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="eyebrow">
              IELTS COMPASS / {t(view as MessageKey).toUpperCase()}
            </span>
          </div>
          <button
            className="language-pill"
            onClick={() =>
              setData({
                ...data,
                language: data.language === "en" ? "vi" : "en",
              })
            }
          >
            <Languages size={15} />
            {data.language === "en" ? "EN" : "VI"}
          </button>
        </header>
        {view === "today" && (
          <Today
            data={data}
            due={due.length}
            t={t}
            onReview={() => setView("review")}
            front={front}
            context={context}
            setFront={setFront}
            setContext={setContext}
            add={add}
          />
        )}
        {view === "review" && <Review data={data} setData={setData} t={t} />}
        {view === "practice" && <Practice language={data.language} t={t} />}
        {view === "library" && <Library data={data} t={t} />}
        {view === "settings" && (
          <Settings data={data} setData={setData} t={t} />
        )}
      </main>
    </div>
  );
}

function Today({
  data,
  due,
  t,
  onReview,
  front,
  context,
  setFront,
  setContext,
  add,
}: {
  data: AppData;
  due: number;
  t: (k: MessageKey) => string;
  onReview: () => void;
  front: string;
  context: string;
  setFront: (v: string) => void;
  setContext: (v: string) => void;
  add: () => void;
}) {
  return (
    <div className="page">
      <section className="hero">
        <div>
          <span className="kicker">
            <Sparkles size={14} /> DAILY PRACTICE
          </span>
          <h1>{t("greeting")}</h1>
          <p>{t("subtitle")}</p>
        </div>
        <div className="band-ring">
          <span>7.0</span>
          <small>TARGET BAND</small>
        </div>
      </section>
      <section className="metric-grid">
        <Metric icon={Brain} label={t("due")} value={String(due)} tone="mint" />
        <Metric
          icon={Flame}
          label={t("streak")}
          value={String(data.progress.streak)}
          tone="orange"
        />
        <Metric
          icon={Clock3}
          label={t("minutes")}
          value={String(data.progress.minutes)}
          tone="blue"
        />
      </section>
      <section className="review-callout">
        <div className="callout-icon">
          <Brain />
        </div>
        <div>
          <span className="eyebrow">SPACED RETRIEVAL</span>
          <h2>{due ? `${due} ${t("due").toLowerCase()}` : t("queueDone")}</h2>
          <p>
            Recall first, reveal second. Short sessions build durable memory.
          </p>
        </div>
        <Button
          label={t("start")}
          variant="primary"
          onClick={onReview}
          endContent={<ChevronRight />}
        />
      </section>
      <div className="two-col">
        <section>
          <SectionTitle
            title={t("weekly")}
            caption="Build range, not just volume"
          />
          <div className="skills">
            {skills.map(({ id, icon: Icon, color }) => (
              <div className="skill-row" key={id}>
                <span style={{ background: color }}>
                  <Icon size={18} />
                </span>
                <div>
                  <b>{t(id)}</b>
                  <small>{data.progress.skillMinutes[id]} min</small>
                </div>
                <div className="bar">
                  <i
                    style={{
                      width: `${Math.max(8, data.progress.skillMinutes[id] * 3)}%`,
                      background: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section>
          <SectionTitle
            title={t("quickCapture")}
            caption="Save language while it is meaningful"
          />
          <Card className="capture-card">
            <TextInput
              label={t("word")}
              value={front}
              onChange={setFront}
              placeholder="e.g. a compelling argument"
              width="100%"
            />
            <TextInput
              label={t("context")}
              value={context}
              onChange={setContext}
              onEnter={add}
              placeholder="Paste the sentence where you found it"
              width="100%"
            />
            <Button
              label={t("add")}
              variant="secondary"
              onClick={add}
              width="100%"
            />
          </Card>
        </section>
      </div>
    </div>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card className={`metric ${tone}`}>
      <span>
        <Icon />
      </span>
      <div>
        <strong>{value}</strong>
        <small>{label}</small>
      </div>
    </Card>
  );
}
function SectionTitle({ title, caption }: { title: string; caption: string }) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        <p>{caption}</p>
      </div>
    </div>
  );
}

function Review({
  data,
  setData,
  t,
}: {
  data: AppData;
  setData: (d: AppData) => void;
  t: (k: MessageKey) => string;
}) {
  const [revealed, setRevealed] = useState(false);
  const due = dueCards(data.cards, new Date());
  const card = due[0];
  const rate = (rating: Rating) => {
    if (!card || !revealed) return;
    setData({
      ...data,
      cards: data.cards.map((c) =>
        c.id === card.id ? schedule(c, rating, new Date()) : c,
      ),
      progress: { ...data.progress, reviewed: data.progress.reviewed + 1 },
    });
    setRevealed(false);
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed(true);
      }
      if (revealed && ["1", "2", "3", "4"].includes(e.key))
        rate(Number(e.key) as Rating);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  });
  return (
    <div className="page narrow">
      <SectionTitle
        title={t("review")}
        caption={`${due.length} ${t("due").toLowerCase()} · Space to reveal · 1–4 to rate`}
      />
      {card ? (
        <div className="review-stage">
          <div className="review-progress">
            <i style={{ width: `${100 / (due.length || 1)}%` }} />
          </div>
          <Card className="flashcard">
            <span className="eyebrow">ACTIVE RECALL</span>
            <h1>{card.front}</h1>
            {card.context && <blockquote>“{card.context}”</blockquote>}
            {revealed ? (
              <div className="answer">
                <small>MEANING</small>
                <p>{card.back || "Add your own meaning after this review."}</p>
              </div>
            ) : (
              <Button
                label={t("reveal")}
                variant="primary"
                onClick={() => setRevealed(true)}
              />
            )}
          </Card>
          {revealed && (
            <div className="rating-row">
              {([1, 2, 3, 4] as Rating[]).map((r) => (
                <button key={r} onClick={() => rate(r)}>
                  <kbd>{r}</kbd>
                  <b>
                    {t(
                      (["again", "hard", "good", "easy"] as MessageKey[])[
                        r - 1
                      ],
                    )}
                  </b>
                  <small>
                    {r === 1 ? "1d" : r === 2 ? "2d" : r === 3 ? "4d" : "7d"}
                  </small>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <Card className="empty-state">
          <span>✓</span>
          <h2>{t("queueDone")}</h2>
          <p>{t("queueDoneText")}</p>
        </Card>
      )}
    </div>
  );
}

function Practice({
  language,
  t,
}: {
  language: Language;
  t: (k: MessageKey) => string;
}) {
  const [mode, setMode] = useState<"speaking" | "writing">("speaking");
  const [seconds, setSeconds] = useState(120);
  const [running, setRunning] = useState(false);
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (!running || seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running, seconds]);
  const reset = () => {
    setRunning(false);
    setSeconds(mode === "speaking" ? 120 : 2400);
  };
  const change = (m: "speaking" | "writing") => {
    setMode(m);
    setRunning(false);
    setSeconds(m === "speaking" ? 120 : 2400);
  };
  const speak = () =>
    speechSynthesis.speak(
      new SpeechSynthesisUtterance(
        t(mode === "speaking" ? "speakingPrompt" : "writingPrompt"),
      ),
    );
  return (
    <div className="page">
      <SectionTitle
        title={t("practiceTitle")}
        caption="Timed, examiner-aligned and distraction-free"
      />
      <div className="mode-tabs">
        <button
          className={mode === "speaking" ? "active" : ""}
          onClick={() => change("speaking")}
        >
          <Mic2 />
          {t("speaking")}
        </button>
        <button
          className={mode === "writing" ? "active" : ""}
          onClick={() => change("writing")}
        >
          <PenLine />
          {t("writing")}
        </button>
      </div>
      <div className="practice-layout">
        <section className="prompt-panel">
          <span className="eyebrow">
            {mode === "speaking" ? "SPEAKING PART 2" : "WRITING TASK 2"}
          </span>
          <h2>{t(mode === "speaking" ? "speakingPrompt" : "writingPrompt")}</h2>
          <Button label={t("speak")} variant="ghost" onClick={speak} />
          <div className="timer">
            <strong>{formatClock(seconds)}</strong>
            <Button
              label={running ? "Pause" : "Start"}
              variant="primary"
              onClick={() => setRunning(!running)}
            />
            <button aria-label={t("reset")} onClick={reset}>
              <RotateCcw />
            </button>
          </div>
        </section>
        <section className="workspace">
          <label>{t(mode === "speaking" ? "plan" : "draft")}</label>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              mode === "speaking"
                ? "• Main idea\n• Specific example\n• Why it matters"
                : "Write your response here…"
            }
            lang={language}
          />
          <span className="word-count">
            {wordCount(draft)} {t("words")}
          </span>
          <div className="rubric">
            <b>Self-check</b>
            {(mode === "speaking"
              ? [
                  "Fluency & coherence",
                  "Lexical resource",
                  "Grammar range",
                  "Pronunciation",
                ]
              : [
                  "Task response",
                  "Coherence & cohesion",
                  "Lexical resource",
                  "Grammar accuracy",
                ]
            ).map((x) => (
              <label key={x}>
                <input type="checkbox" /> {x}
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Library({ data, t }: { data: AppData; t: (k: MessageKey) => string }) {
  return (
    <div className="page">
      <SectionTitle
        title={t("deck")}
        caption={`${data.cards.length} cards · stored on this device`}
      />
      <div className="deck-list">
        {data.cards.length ? (
          data.cards.map((c) => (
            <Card className="deck-card" key={c.id}>
              <div>
                <h3>{c.front}</h3>
                <p>{c.back || "Meaning not added yet"}</p>
                {c.context && <small>“{c.context}”</small>}
              </div>
              <span>
                {c.reviews} reviews
                <br />
                next · {new Date(c.due).toLocaleDateString()}
              </span>
            </Card>
          ))
        ) : (
          <p>{t("empty")}</p>
        )}
      </div>
    </div>
  );
}
function Settings({
  data,
  setData,
  t,
}: {
  data: AppData;
  setData: (d: AppData) => void;
  t: (k: MessageKey) => string;
}) {
  const download = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([serializeData(data)], { type: "application/json" }),
    );
    a.download = "ielts-compass-backup.json";
    a.click();
  };
  return (
    <div className="page narrow">
      <SectionTitle
        title={t("settings")}
        caption="Own your practice and your data"
      />
      <Card className="privacy-card">
        <LockKeyhole />
        <div>
          <h2>{t("privacy")}</h2>
          <p>{t("privacyText")}</p>
        </div>
      </Card>
      <section className="settings-row">
        <div>
          <b>{t("language")}</b>
          <p>English is the default interface language.</p>
        </div>
        <div className="segmented">
          <button
            className={data.language === "en" ? "active" : ""}
            onClick={() => setData({ ...data, language: "en" })}
          >
            {t("english")}
          </button>
          <button
            className={data.language === "vi" ? "active" : ""}
            onClick={() => setData({ ...data, language: "vi" })}
          >
            {t("vietnamese")}
          </button>
        </div>
      </section>
      <section className="settings-row">
        <div>
          <b>Your data</b>
          <p>Download a portable JSON backup at any time.</p>
        </div>
        <Button label={t("export")} variant="secondary" onClick={download} />
      </section>
    </div>
  );
}
