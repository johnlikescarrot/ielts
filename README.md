# 🏹 IELTS Slayer — Firefox WebExtension (100% Free, Privacy-First)

**IELTS Slayer** is a privacy-first, zero-login WebExtension for Firefox designed for comprehensive IELTS preparation
(Band 6.0 – 9.0). It is built with modern TypeScript, React 19, Astryx, Tailwind CSS, Lucide icons, and local
AST-powered writing heuristics. English is the default UI language, with full Vietnamese support.

---

## 🌟 Highlights & Key Features

- **100% Free & Open-Source**: Zero subscription fees, zero telemetry, zero paywalls.
- **Privacy-First & Offline Capable**: All essays, audio recordings, mock scores, settings, and flashcards stay strictly
  inside Firefox local storage (`browser.storage.local` with memory fallback). No account or server required.
- **Dual Language Parity**: Full bilingual user interface — English (default) and Vietnamese (Tiếng Việt) with
  instantaneous on-the-fly toggling.
- **4 Complete Skill Modules**:
  1. **Reading Practice**: Academic & General Training passages, multi-color highlighting tool (Yellow, Green, Blue),
     countdown timer, multiple-choice / True-False-Not-Given / sentence completion questions, instant band conversion,
     and bilingual explanation keys.
  2. **Listening Simulator**: Multi-section audio simulation, audio playback controls (0.75x–1.5x speeds), interactive
     transcript toggles, and answer submission with scoring.
  3. **Writing Evaluator (AST Heuristic)**: Abstract Syntax Tree tokenization & structural syntactic parsing for
     Academic Task 1 & Task 2 essays. Automated grading across Task Response / Achievement (TR), Coherence & Cohesion
     (CC), Lexical Resource (LR with Academic Word List detection), and Grammatical Range & Accuracy (GRA with
     clause/connector parsing and readability indices: Flesch-Kincaid, Automated Readability Index, Gunning Fog Index).
  4. **Speaking Lab**: Authentic 3-part mock interview format (Part 1 everyday topics, Part 2 cue cards with 1-min prep
     timer, Part 3 abstract discussions), built-in voice recorder with playback and download, official IELTS band
     descriptors, topic idioms, and model answers.
  5. **Video Transcript Lab**: Convert any transcript you already have into deterministic IELTS gap-fill practice. Paste
     raw captions, WebVTT, or SRT from YouTube, Bilibili, or another source; the extension deduplicates cues, finds
     meaningful vocabulary, preserves timecodes, checks answers locally, and lets learners add Academic Word List hits
     straight to SRS. It never fetches a video URL, uploads captions, uses an API key, or requires a login.
- **Spaced Repetition (SRS) Vocabulary Engine**: SuperMemo SM-2 algorithm managing 500+ Band 7–9 words, Academic Word
  List (AWL), definitions, phonetic transcriptions, collocations, examples, and interactive mini-quizzes.
- **Full Mock Exam Simulator**: 4-skill score weighting and realistic IELTS Test Report Form (TRF) composite band
  calculation.
- **Analytics & History**: Score progress tracking, skill breakdown charts, study streak counters, and full JSON data
  backup export/import.
- **Webpage Vocabulary Inspector**: Highlight any English word on any webpage while browsing Firefox to look up CEFR
  level, band score, bilingual definitions, and save directly to your SRS flashcard deck.

---

## 🛠️ Technology Stack

- **Platform**: Firefox WebExtension (Manifest V3 / Manifest V2 compatible)
- **Language**: TypeScript 5.3+ (Strict mode)
- **UI Framework**: React 19, [Astryx](https://github.com/facebook/astryx) design system & Lucide Icons
- **Styling**: Astryx Neutral theme, Tailwind CSS & PostCSS
- **Bundler**: Vite 6 (Multi-page configuration for Dashboard, Popup, Background worker, Content Script)
- **Testing**: Vitest, React Testing Library, jsdom, and a strict 100% line/function/branch/statement coverage gate for
  the deterministic transcript-practice engine

---

## 🚀 Development & Build

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

### Run Tests & Code Coverage

```bash
# Run all unit and integration tests
npm test

# Run tests with the strict transcript-engine V8 coverage gate (100%)
npm run test:coverage
```

GitHub Actions also runs [`super-linter/super-linter`](https://github.com/super-linter/super-linter) on every pull
request and Arena branch push.

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

### Build for Production

```bash
npm run build
```

The compiled extension artifacts will be generated in `dist/`.

---

## 🎬 Video Transcript Lab — private practice from real content

The Video Transcript Lab is the privacy-preserving Firefox-extension counterpart to the transcript-driven learning
workflow popularized by [IELTS Video Assistant](https://github.com/Libailin222/ielts-video-assistant). It deliberately
makes a different trade-off: all practice generation is deterministic and on-device, so it stays free, works without a
login or API key, and never sends captions to a third party.

1. Open **Video Transcript Lab** from the navigation.
2. Give the set a title; a source URL is optional and is stored only as a local reference.
3. Paste plain captions, `.vtt`, or `.srt` text. The lab strips caption markup, keeps valid timestamps, and removes
   repeated cues.
4. Select **Create gap-fill practice**, answer each locally generated cloze question, and add detected AWL terms to the
   SRS deck if useful.
5. Saved sets, answers, vocabulary, and attempts remain in `browser.storage.local` and are included in the existing JSON
   backup/export flow.

> **Privacy boundary:** The extension does not download a video, inspect browser cookies, call an AI model, or fetch the
> supplied URL. You control which transcript text is pasted into the local practice set.

---

## 🦊 Loading Extension in Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select `dist/manifest.json` from this repository.
4. Click the IELTS Slayer icon in your Firefox toolbar or access the Dashboard directly via
   `moz-extension://<extension-id>/dashboard.html`.

---

## 📄 License

MIT License. Free for all learners worldwide.
