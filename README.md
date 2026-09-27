# 🏹 IELTS Slayer — Firefox WebExtension (100% Free, Privacy-First)

**IELTS Slayer** is a privacy-first, zero-login Firefox WebExtension for comprehensive IELTS preparation (Band 6.0 – 9.0). It is built with strict TypeScript, React 19, Tailwind CSS, Lucide icons, the [Meta Astryx design system](https://github.com/facebook/astryx), and local AST-powered writing heuristics.

---

## 🌟 Highlights & Key Features

- **100% Free & Open-Source**: Zero subscription fees, zero telemetry, zero paywalls.
- **Privacy-First & Offline Capable**: All essays, audio recordings, mock scores, settings, and flashcards stay strictly inside Firefox local storage (`browser.storage.local` with memory fallback). No account or server required.
- **Dual Language Parity**: Full bilingual user interface — English (default) and Vietnamese (Tiếng Việt) with instantaneous on-the-fly toggling.
- **4 Complete Skill Modules**:
  1. **Reading Practice**: Academic & General Training passages, multi-color highlighting tool (Yellow, Green, Blue), countdown timer, multiple-choice / True-False-Not-Given / sentence completion questions, instant band conversion, and bilingual explanation keys.
  2. **Listening Simulator**: Multi-section audio simulation, audio playback controls (0.75x–1.5x speeds), interactive transcript toggles, and answer submission with scoring.
  3. **Writing Evaluator (local AST heuristic)**: Abstract Syntax Tree tokenization & structural syntactic parsing for Academic Task 1 & Task 2 essays. Automated grading across Task Response / Achievement (TR), Coherence & Cohesion (CC), Lexical Resource (LR with Academic Word List detection), and Grammatical Range & Accuracy (GRA with clause/connector parsing and readability indices: Flesch-Kincaid, Automated Readability Index, Gunning Fog Index).
  4. **Speaking Lab**: Authentic 3-part mock interview format (Part 1 everyday topics, Part 2 cue cards with 1-min prep timer, Part 3 abstract discussions), built-in voice recorder with playback and download, official IELTS band descriptors, topic idioms, and model answers.
- **Spaced Repetition (SRS) Vocabulary Engine**: SuperMemo SM-2 algorithm managing 500+ Band 7–9 words, Academic Word List (AWL), definitions, phonetic transcriptions, collocations, examples, and interactive mini-quizzes.
- **Full Mock Exam Simulator**: 4-skill score weighting and realistic IELTS Test Report Form (TRF) composite band calculation.
- **Analytics & History**: Score progress tracking, skill breakdown charts, study streak counters, and full JSON data backup export/import.
- **Adaptive Daily Study Plan**: A deterministic, offline planner prioritizes due SM-2 cards, identifies the weakest recent skill, and fills the remaining time with balanced practice. It never uploads scores or requires an account.
- **Webpage Vocabulary Inspector**: Highlight any English word on any webpage while browsing Firefox to look up CEFR level, band score, bilingual definitions, and save directly to your SRS flashcard deck.
- **Video Lab for focused listening**: On YouTube and Bilibili, an on-page bilingual panel can replay a 5-, 10-, 20-, or 30-second segment, change speed, and save timestamped clips. The extension controls only the page's existing video element; it never uploads media, reads an account, or calls an AI service.

### 🎬 Video Lab workflow

1. Open a YouTube or Bilibili video in Firefox and start playback.
2. Use **IELTS Video Lab** in the lower-right corner to select a short loop and practise it at 0.75×, 1×, or 1.25×.
3. Choose **Save clip** to keep the source link and timestamps in Firefox local storage.
4. Open **Video Lab** from the dashboard to replay a saved timestamp or remove it. The panel defaults to English and can switch to Vietnamese directly.

This local timestamp-and-repeat workflow was informed by research into [IELTS Video Assistant](https://github.com/Libailin222/ielts-video-assistant), while retaining IELTS Slayer's free, no-login, on-device privacy model.

### Research-informed update
The companion [IELTS Video Assistant](https://github.com/Libailin222/ielts-video-assistant) demonstrates the value of turning authentic media into immediate IELTS practice across Reading, Listening, Speaking, and Writing. IELTS Slayer keeps that learner-first focus while preserving a fully offline/no-login promise: the new adaptive plan turns each local result and review queue into the next best action, so learners do not have to decide what to study next.

---

## 🛠️ Technology Stack

- **Platform**: Firefox WebExtension (Manifest V3 / Manifest V2 compatible)
- **Language**: TypeScript 5.3+ (Strict mode)
- **UI Framework**: React 19, Lucide Icons, and accessible components from [Meta Astryx](https://github.com/facebook/astryx)
- **Styling**: Tailwind CSS, PostCSS, and Astryx Neutral theme tokens
- **Bundler**: Vite 6 (Multi-page configuration for Dashboard, Popup, Background worker, Content Script)
- **Testing**: Vitest, React Testing Library, jsdom, V8 Coverage

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

# Run tests with V8 code coverage report
npm run test:coverage
```

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

## 🦊 Loading Extension in Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **"Load Temporary Add-on..."**.
3. Select `dist/manifest.json` from this repository.
4. Click the IELTS Slayer icon in your Firefox toolbar or access the Dashboard directly via `moz-extension://<extension-id>/dashboard.html`.

---

## 📄 License
MIT License. Free for all learners worldwide.
