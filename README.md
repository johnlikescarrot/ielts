# 🏹 IELTS Slayer — Firefox WebExtension (100% Free, Privacy-First)

**IELTS Slayer** is a Firefox-first, privacy-first, zero-login WebExtension for comprehensive IELTS preparation (Band 6.0–9.0). It combines TypeScript, React 19, Facebook Astryx, Tailwind CSS, Lucide icons, AST-powered writing heuristics, SuperMemo SM-2 vocabulary scheduling, adaptive local study planning, and bilingual English/Vietnamese UX.

---

## 🌟 Highlights & Key Features

- **100% Free & Open-Source**: Zero subscription fees, zero telemetry, zero paywalls, and no account required.
- **Privacy-First & Offline Capable**: Essays, recordings, mock scores, settings, flashcards, bookmarks, notes, and study-plan metrics stay inside Firefox storage (`browser.storage.local` with local fallback).
- **English Default + Vietnamese Support**: Full UI language switcher plus localized Firefox manifest metadata via `_locales/en` and `_locales/vi`.
- **Facebook Astryx Design Layer**: React 19 + Astryx theme provider, Astryx CSS, Astryx CLI validation, and Astryx components power the new evidence panel while preserving the custom IELTS workflow UI.
- **Scholar-Ready Evidence Kit**: Curated language-learning and assessment references for IELTS reading, listening, writing, speaking, and vocabulary. Learners can download a Markdown Scholar kit and jump to Google Scholar searches from the dashboard.
- **Adaptive Daily Plan**: Replaces hard-coded streaks with local, privacy-first progress metrics; tracks today’s minutes against the learner’s goal, calculates a resilient calendar-day streak, and recommends the weakest practiced skill. Progress is computed offline from saved attempts and never requires an account.
- **4 Complete IELTS Skill Modules**:
  1. **Reading Practice**: Academic & General Training passages, highlighting, countdown timer, multiple question types, instant band conversion, and bilingual explanations.
  2. **Listening Simulator**: Multi-section audio simulation, transcript toggles, playback speed controls, and answer submission with scoring.
  3. **Writing Evaluator (AST Heuristic)**: Abstract Syntax Tree tokenization and structural parsing for IELTS Writing Task 1/2. Automated feedback for TR/TA, CC, LR, and GRA plus readability metrics.
  4. **Speaking Lab**: Authentic 3-part mock interview, timers, offline voice recorder, self-rubrics, topic idioms, and model answers.
- **Spaced Repetition Vocabulary Engine**: SuperMemo SM-2 flashcards for Band 7–9 vocabulary, AWL terms, collocations, bilingual definitions, examples, and mini-quizzes.
- **Full Mock Exam Simulator**: 4-skill score weighting and Test Report Form-style overall band calculation.
- **Analytics & Backup**: Score history, skill breakdown, study consistency, and JSON export/import.
- **Webpage Vocabulary Inspector**: Highlight English words on pages to inspect CEFR level, band score, bilingual definitions, and save terms to SRS.

---

## 🛠️ Technology Stack

- **Platform**: Firefox WebExtension (Manifest V3)
- **Language**: TypeScript 5.7+ in strict mode
- **UI Framework**: React 19, Facebook Astryx, Lucide React
- **Styling**: Astryx CSS + Tailwind CSS + PostCSS
- **Bundler**: Vite 6 multi-entry build for Dashboard, Popup, Background script, and Content Script
- **Testing**: Vitest, React Testing Library, jsdom, V8 Coverage
- **Quality**: ESLint, TypeScript checks, GitHub Super-Linter workflow, CI coverage artifacts

---

## 🚀 Development & Build

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

### Astryx CLI

```bash
npm run astryx -- component --list
npm run astryx -- component Button --detail compact
```

### Tests & Coverage

```bash
npm test
npm run test:coverage
```

The project enforces global coverage thresholds and keeps the new evidence engine / Astryx research panel at 100% coverage. Current target gates:

- Lines: 95%+
- Statements: 95%+
- Functions: 90%+
- Branches: 85%+

### Type Checking & Linting

```bash
npm run typecheck
npm run lint
```

### Build for Production

```bash
npm run build
```

The compiled extension artifacts are generated in `dist/`.

---

## 🦊 Loading Extension in Firefox

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `dist/manifest.json`.
4. Click the IELTS Slayer toolbar icon or open `moz-extension://<extension-id>/dashboard.html`.

---

## ✅ Quality Workflow

CI runs:

1. `npm ci`
2. `npm run astryx -- component --list --json`
3. `npm run typecheck`
4. `npm run lint`
5. `npm run test:coverage`
6. `npm run build`
7. Super-Linter (`super-linter/super-linter@v8.3.1`)

---

## 📄 License

MIT License. Free for learners worldwide.
