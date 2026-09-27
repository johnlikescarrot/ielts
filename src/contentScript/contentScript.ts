import { ACADEMIC_WORD_LIST } from "../ast/awlList";
import { INITIAL_VOCABULARY } from "../data/vocabularyBank";
import { Language } from "../types";
import {
  LOOP_DURATIONS,
  VideoLoop,
  VideoPage,
  createVideoLoop,
  formatVideoTimestamp,
  getVideoPage,
} from "../video/videoStudy";

let activeTooltip: HTMLElement | null = null;
let activeVideoPanel: { element: HTMLElement; cleanup: () => void } | null =
  null;
let videoPanelObserver: MutationObserver | null = null;

interface InspectorWord {
  word: string;
  phonetic: string;
  cefr: string;
  band: number;
  defEn: string;
  defVi: string;
}

interface VideoLabCopy {
  title: string;
  subtitle: string;
  loopFor: (seconds: number) => string;
  stopLoop: string;
  replay: string;
  saveClip: string;
  saved: string;
  speed: string;
  language: string;
  looping: (start: string, end: string) => string;
  ready: string;
  savedStatus: (start: string, end: string) => string;
  unavailable: string;
  privacy: string;
}

const videoLabCopy: Record<Language, VideoLabCopy> = {
  en: {
    title: "IELTS Video Lab",
    subtitle: "Repeat a short listening segment, then save it for later.",
    loopFor: (seconds) => `Loop ${seconds}s`,
    stopLoop: "Stop loop",
    replay: "Replay segment",
    saveClip: "Save clip",
    saved: "Saved",
    speed: "Speed",
    language: "Tiếng Việt",
    looping: (start, end) => `Looping ${start}–${end}`,
    ready: "Choose a loop length to practise this moment.",
    savedStatus: (start, end) =>
      `Saved ${start}–${end} to your local clip library.`,
    unavailable: "This video is not ready yet. Start playback and try again.",
    privacy:
      "Free, local controls — no video, audio, or account is sent anywhere.",
  },
  vi: {
    title: "Phòng học video IELTS",
    subtitle: "Lặp lại một đoạn nghe ngắn, rồi lưu lại để ôn sau.",
    loopFor: (seconds) => `Lặp ${seconds} giây`,
    stopLoop: "Dừng lặp",
    replay: "Nghe lại đoạn",
    saveClip: "Lưu đoạn",
    saved: "Đã lưu",
    speed: "Tốc độ",
    language: "English",
    looping: (start, end) => `Đang lặp ${start}–${end}`,
    ready: "Chọn độ dài lặp để luyện ngay tại thời điểm này.",
    savedStatus: (start, end) =>
      `Đã lưu ${start}–${end} vào thư viện đoạn nghe cục bộ.`,
    unavailable: "Video chưa sẵn sàng. Hãy bắt đầu phát rồi thử lại.",
    privacy:
      "Điều khiển miễn phí, cục bộ — không gửi video, âm thanh hay tài khoản đi đâu.",
  },
};

function createButton(
  label: string,
  className: string,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function sendExtensionMessage(message: unknown): void {
  if (typeof browser === "undefined" || !browser.runtime?.sendMessage) return;

  Promise.resolve(browser.runtime.sendMessage(message)).catch(() => {
    // Content scripts can outlive the extension reload; the controls remain usable.
  });
}

export function removeTooltip(): void {
  if (activeTooltip?.parentNode) {
    activeTooltip.parentNode.removeChild(activeTooltip);
  }
  activeTooltip = null;
}

export function lookupWord(rawWord: string): InspectorWord | null {
  const normalized = rawWord
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (!normalized || normalized.length < 3) return null;

  const bankMatch = INITIAL_VOCABULARY.find(
    (v) => v.word.toLowerCase() === normalized,
  );
  if (bankMatch) {
    return {
      word: bankMatch.word,
      phonetic: bankMatch.phonetic,
      cefr: bankMatch.cefrLevel,
      band: bankMatch.bandScore,
      defEn: bankMatch.definitionEn,
      defVi: bankMatch.definitionVi,
    };
  }

  const awlMatch = ACADEMIC_WORD_LIST[normalized];
  if (awlMatch) {
    return {
      word: normalized,
      phonetic: "/.../",
      cefr: awlMatch.cefr,
      band: awlMatch.cefr === "C2" ? 8.5 : awlMatch.cefr === "C1" ? 7.5 : 6.5,
      defEn: awlMatch.definition,
      defVi: awlMatch.definitionVi,
    };
  }

  return null;
}

export function handleSelection(): void {
  if (typeof window === "undefined") return;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    removeTooltip();
    return;
  }

  const selectedText = selection.toString().trim();
  const info = lookupWord(selectedText);
  if (!info) {
    removeTooltip();
    return;
  }

  removeTooltip();

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const tooltip = document.createElement("div");
  tooltip.className = "ielts-slayer-tooltip";
  tooltip.style.left = `${window.scrollX + rect.left}px`;
  tooltip.style.top = `${window.scrollY + rect.bottom + 8}px`;

  tooltip.innerHTML = `
    <div class="ielts-slayer-tooltip-header">
      <span class="ielts-slayer-tooltip-title">${info.word}</span>
      <span class="ielts-slayer-tooltip-badge">Band ${info.band.toFixed(1)} (${info.cefr})</span>
    </div>
    <div class="ielts-slayer-tooltip-def">${info.defEn}</div>
    <div class="ielts-slayer-tooltip-def-vi">${info.defVi}</div>
    <button class="ielts-slayer-tooltip-btn" id="ielts-save-btn">+ Add to IELTS Flashcards</button>
  `;

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;

  const saveBtn = tooltip.querySelector(
    "#ielts-save-btn",
  ) as HTMLButtonElement | null;
  if (saveBtn) {
    saveBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      saveBtn.textContent = "✓ Saved to Flashcards!";
      sendExtensionMessage({
        type: "SAVE_VOCABULARY",
        data: {
          id: `cs_${Date.now()}`,
          word: info.word,
          phonetic: info.phonetic,
          definitionEn: info.defEn,
          definitionVi: info.defVi,
          partOfSpeech: "word",
          example: `Found in context: "${selectedText}"`,
          collocations: [],
          synonyms: [],
          topic: "Web Inspector",
          bandScore: info.band,
          cefrLevel: info.cefr,
          isAWL: true,
        },
      });
      setTimeout(removeTooltip, 1200);
    });
  }
}

export function removeVideoStudyPanel(): void {
  activeVideoPanel?.cleanup();
  activeVideoPanel = null;
}

function resolveVideoPage(pageUrl: string): VideoPage | null {
  return getVideoPage(pageUrl);
}

/**
 * Adds a lightweight study controller to YouTube and Bilibili pages. It controls
 * the site's existing HTMLVideoElement only; it never fetches media or captions.
 */
export function mountVideoStudyPanel(
  video: HTMLVideoElement | null = document.querySelector("video"),
  pageUrl: string = window.location.href,
): HTMLElement | null {
  const page = resolveVideoPage(pageUrl);
  if (!page || !video || typeof document === "undefined") return null;

  removeVideoStudyPanel();

  const panel = document.createElement("aside");
  panel.className = "ielts-slayer-video-lab";
  panel.setAttribute("aria-label", "IELTS Video Lab");
  panel.dataset.provider = page.provider;
  document.body.appendChild(panel);

  let language: Language = "en";
  let loop: VideoLoop | null = null;
  let loopDuration: number = LOOP_DURATIONS[1];
  let isLooping = false;
  let status = videoLabCopy[language].ready;

  const replayLoop = () => {
    if (!loop) return;
    video.currentTime = loop.startSeconds;
    void video.play().catch(() => undefined);
  };

  const onTimeUpdate = () => {
    if (isLooping && loop && video.currentTime >= loop.endSeconds) {
      replayLoop();
    }
  };

  const saveCurrentClip = () => {
    const clip =
      loop || createVideoLoop(video.currentTime, loopDuration, video.duration);
    const copy = videoLabCopy[language];
    if (!clip) {
      status = copy.unavailable;
      render();
      return;
    }

    loop = clip;
    const start = formatVideoTimestamp(clip.startSeconds);
    const end = formatVideoTimestamp(clip.endSeconds);
    status = copy.savedStatus(start, end);
    sendExtensionMessage({
      type: "SAVE_VIDEO_CLIP",
      data: {
        provider: page.provider,
        sourceUrl: page.url,
        sourceTitle: document.title || page.provider,
        startSeconds: clip.startSeconds,
        endSeconds: clip.endSeconds,
      },
    });
    render();
  };

  const startLoop = (duration: number) => {
    const nextLoop = createVideoLoop(
      video.currentTime,
      duration,
      video.duration,
    );
    const copy = videoLabCopy[language];
    if (!nextLoop) {
      status = copy.unavailable;
      render();
      return;
    }

    loopDuration = duration;
    loop = nextLoop;
    isLooping = true;
    status = copy.looping(
      formatVideoTimestamp(nextLoop.startSeconds),
      formatVideoTimestamp(nextLoop.endSeconds),
    );
    void video.play().catch(() => undefined);
    render();
  };

  const stopLoop = () => {
    isLooping = false;
    status = videoLabCopy[language].ready;
    render();
  };

  const render = () => {
    const copy = videoLabCopy[language];
    panel.replaceChildren();
    panel.setAttribute("aria-label", copy.title);

    const header = document.createElement("div");
    header.className = "ielts-slayer-video-lab__header";
    const heading = document.createElement("strong");
    heading.textContent = copy.title;
    const languageButton = createButton(
      copy.language,
      "ielts-slayer-video-lab__language",
      () => {
        language = language === "en" ? "vi" : "en";
        status = videoLabCopy[language].ready;
        render();
      },
    );
    header.append(heading, languageButton);

    const subtitle = document.createElement("p");
    subtitle.className = "ielts-slayer-video-lab__subtitle";
    subtitle.textContent = copy.subtitle;

    const controls = document.createElement("div");
    controls.className = "ielts-slayer-video-lab__controls";
    LOOP_DURATIONS.forEach((duration) => {
      const button = createButton(
        copy.loopFor(duration),
        "ielts-slayer-video-lab__button",
        () => startLoop(duration),
      );
      button.setAttribute(
        "aria-pressed",
        String(isLooping && loopDuration === duration),
      );
      controls.appendChild(button);
    });

    const actions = document.createElement("div");
    actions.className = "ielts-slayer-video-lab__actions";
    if (isLooping) {
      actions.appendChild(
        createButton(
          copy.stopLoop,
          "ielts-slayer-video-lab__button ielts-slayer-video-lab__button--secondary",
          stopLoop,
        ),
      );
    }
    actions.appendChild(
      createButton(
        copy.replay,
        "ielts-slayer-video-lab__button ielts-slayer-video-lab__button--secondary",
        replayLoop,
      ),
    );
    actions.appendChild(
      createButton(
        copy.saveClip,
        "ielts-slayer-video-lab__button ielts-slayer-video-lab__button--primary",
        saveCurrentClip,
      ),
    );

    const speedRow = document.createElement("label");
    speedRow.className = "ielts-slayer-video-lab__speed";
    speedRow.textContent = `${copy.speed}: `;
    const speedSelect = document.createElement("select");
    speedSelect.setAttribute("aria-label", copy.speed);
    [0.75, 1, 1.25].forEach((rate) => {
      const option = document.createElement("option");
      option.value = String(rate);
      option.textContent = `${rate}×`;
      option.selected = video.playbackRate === rate;
      speedSelect.appendChild(option);
    });
    speedSelect.addEventListener("change", () => {
      video.playbackRate = Number(speedSelect.value);
    });
    speedRow.appendChild(speedSelect);

    const statusText = document.createElement("p");
    statusText.className = "ielts-slayer-video-lab__status";
    statusText.setAttribute("aria-live", "polite");
    statusText.textContent = status;

    const privacy = document.createElement("p");
    privacy.className = "ielts-slayer-video-lab__privacy";
    privacy.textContent = copy.privacy;

    panel.append(
      header,
      subtitle,
      controls,
      actions,
      speedRow,
      statusText,
      privacy,
    );
  };

  video.addEventListener("timeupdate", onTimeUpdate);
  render();
  activeVideoPanel = {
    element: panel,
    cleanup: () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      panel.remove();
    },
  };

  return panel;
}

/** Watches single-page video sites until their player becomes available. */
export function initializeVideoStudyPanel(
  pageUrl: string = window.location.href,
): void {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  if (!resolveVideoPage(pageUrl)) {
    removeVideoStudyPanel();
    videoPanelObserver?.disconnect();
    videoPanelObserver = null;
    return;
  }

  if (mountVideoStudyPanel(undefined, pageUrl)) return;
  if (videoPanelObserver) return;

  videoPanelObserver = new MutationObserver(() => {
    if (mountVideoStudyPanel(undefined, pageUrl)) {
      videoPanelObserver?.disconnect();
      videoPanelObserver = null;
    }
  });
  videoPanelObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

if (typeof document !== "undefined") {
  document.addEventListener("mouseup", handleSelection);
  document.addEventListener("mousedown", (event) => {
    if (activeTooltip && !activeTooltip.contains(event.target as Node)) {
      removeTooltip();
    }
  });
  window.addEventListener("popstate", () => initializeVideoStudyPanel());
  document.addEventListener("yt-navigate-finish", () =>
    initializeVideoStudyPanel(),
  );
  initializeVideoStudyPanel();
}
