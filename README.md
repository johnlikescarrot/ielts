# 🏹 IELTS Slayer — Firefox WebExtension (100% Free, Privacy-First)

**IELTS Slayer** is a privacy-first, zero-login WebExtension for Firefox
designed for comprehensive IELTS preparation (Band 6.0 – 9.0). It is built
with strict TypeScript, React 19, Tailwind CSS, Lucide icons, and the locally
bundled [Astryx design system](https://github.com/facebook/astryx).

---

## 🌟 Highlights & Key Features

- **100% Free & Open-Source**: Zero subscription fees, zero telemetry, zero
  paywalls.
- **Privacy-First & Offline Capable**: All essays, audio recordings, mock
  scores, settings, and flashcards stay inside Firefox local storage
  (`browser.storage.local`, with a testable local fallback). No account,
  server, tracking, ads, or remote analytics are required.
- **Dual Language Parity**: English is the default, with Vietnamese (Tiếng
  Việt) available throughout the dashboard, settings, and popup quick-study
  surface.
- **4 Complete Skill Modules**:
  1. **Reading Practice**: Academic & General Training passages,
     multi-color highlighting tool (Yellow, Green, Blue), countdown
     timer, multiple-choice / True-False-Not-Given / sentence completion
     questions, instant band conversion, and bilingual explanation keys.
  2. **Listening Simulator**: Multi-section audio simulation, audio
     playback controls (0.75x–1.5x speeds), interactive transcript
     toggles, and answer submission with scoring.
  3. **Writing Evaluator (transparent local AST heuristic)**: Abstract
     Syntax Tree tokenization and structural parsing for Academic Task 1
     & Task 2 essays. It gives learning feedback across Task Response /
     Achievement (TR), Coherence & Cohesion (CC), Lexical Resource (LR
     with Academic Word List detection), and Grammatical Range & Accuracy
     (GRA with clause/connector parsing and readability indices). It is a
     study aid, not an official IELTS score or an AI service.
  4. **Speaking Lab**: Authentic 3-part mock interview format (Part 1
     everyday topics, Part 2 cue cards with 1-min prep timer, Part 3
     abstract discussions), built-in voice recorder with playback and
     download, official IELTS band descriptors, topic idioms, and model
     answers.
- **Astryx UI foundation**: The shared theme provider, local component CSS,
  and popup card/action surface use
  [facebook/astryx](https://github.com/facebook/astryx) without any CDN
  dependency or network request.
- **Spaced Repetition (SRS) Vocabulary Engine**: SuperMemo SM-2 algorithm
  managing a curated Band 7–9 starter bank plus custom words, Academic Word
  List (AWL), definitions, phonetic transcriptions, collocations, examples,
  and interactive mini-quizzes.
- **Full Mock Exam Simulator**: 4-skill score weighting and realistic IELTS
  Test Report Form (TRF) composite band calculation.
- **Analytics & History**: Score progress tracking, skill breakdown charts,
  study streak counters, and full JSON data backup export/import.
- **Webpage Vocabulary Inspector**: Highlight any English word on any
  webpage while browsing Firefox to look up CEFR level, band score,
  bilingual definitions, and save directly to your SRS flashcard deck.

---

## 🛠️ Technology Stack

- **Platform**: Firefox WebExtension (Manifest V3)
- **Language**: TypeScript 5.7+ (Strict mode)
- **UI Framework**: React 19, Astryx, Tailwind CSS & Lucide Icons
- **Styling**: Astryx local theme CSS, Tailwind CSS & PostCSS
- **Bundler**: Vite 6 (multi-page configuration for Dashboard, Popup,
  Background script, and Content Script)
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
4. Click the IELTS Slayer icon in your Firefox toolbar or access the
   Dashboard directly via `moz-extension://<extension-id>/dashboard.html`.

---

## 📄 License

MIT License. Free for all learners worldwide.
