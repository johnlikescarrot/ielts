# 🏹 IELTS Slayer — Free, Private IELTS Preparation for Firefox

[![CI](https://github.com/johnlikescarrot/ielts/actions/workflows/ci.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/ci.yml)
[![Super-Linter](https://github.com/johnlikescarrot/ielts/actions/workflows/super-linter.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/super-linter.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**IELTS Slayer** is a TypeScript Firefox extension for serious IELTS practice without an account, subscription, API key, telemetry, or remote learner profile. English is the default interface language; every workflow also supports Vietnamese.

> **Tiếng Việt:** IELTS Slayer là tiện ích Firefox luyện IELTS miễn phí, không cần đăng nhập và lưu dữ liệu học tập ngay trên thiết bị. Chuyển sang **VI 🇻🇳** trong thanh điều hướng để dùng giao diện tiếng Việt.

## ✨ What makes it different

### New in 1.1 — Private Video IELTS Lab & Shadowing Studio

Turn any captioned English video or local media file into active IELTS listening and speaking practice:

1. **Multi-Source Support:** Load YouTube videos, drag-and-drop local video/audio files (MP4, WebM, MKV, MP3, WAV), paste YouTube transcripts, or upload `.srt` / `.vtt` subtitles.
2. **Chunk-by-Chunk Shadowing Studio:** Sliced playback by subtitle cue or configurable time intervals, with speed cycling (`0.5x` to `2.0x`), subtitle overlay toggling, auto-advance, and smart "Shadow Echo Pause".
3. **On-Device Voice Recording & Pronunciation Scoring:** Record voice shadowing directly in the browser; receive immediate phonetic alignment, Levenshtein distance accuracy scoring, word-level color breakdown, and an IELTS Pronunciation Band estimate (`Band 5.0` to `9.0`).
4. **Keyboard Shortcuts:** Ergonomic hotkeys for rapid practice (`Space` to replay/pause, `←` / `→` for previous/next chunk, `R` to cycle speed, `M` to record voice, `A` to toggle auto-advance, `S` for subtitles).
5. **Interactive Subtitle Timeline & Search:** Live search filter across all caption cues, jump to timestamp, and one-click export to clean `.SRT` or `.VTT`.
6. **Curated IELTS Band 8.5–9.0 Library:** Preloaded high-scoring model responses covering Speaking Part 1, Part 2 (Cue Card), Part 3, and Listening Section 4 academic lectures.
7. **Listening Cloze Challenge & Spaced Repetition:** Deterministic on-device cloze exercises, immediate scoring, and one-click addition of detected Academic Word List terms directly into your SM-2 flashcard deck.

No transcript or voice recording is uploaded to external servers. No generative-AI key or login required.

The architecture was informed by open-source research and tools including [`Hossein-Mosaffa/shadowing-player`](https://github.com/Hossein-Mosaffa/shadowing-player) and [`Libailin222/ielts-video-assistant`](https://github.com/Libailin222/ielts-video-assistant), engineered into a 100% private, zero-configuration local engine suited to a Firefox browser extension.

### Complete preparation suite

- **Reading:** Academic and General Training passages, highlighting, timers, band conversion, and bilingual explanations.
- **Listening:** Four-section practice, adjustable playback, transcripts, scoring, and answer review.
- **Writing:** Local AST-based analysis across Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Includes AWL detection and multiple readability indices.
- **Speaking:** Three-part interview simulation, preparation and response timers, private voice recording, model answers, and self-assessment.
- **Vocabulary:** An SM-2 spaced-repetition deck, contextual examples, collocations, synonyms, and mini-quizzes.
- **Mock exam and analytics:** Composite band calculation, local history, streaks, and portable JSON backup/restore.
- **Web vocabulary inspector:** Select supported academic vocabulary on a page to see CEFR/band guidance and bilingual definitions.

## 🔒 Privacy and access

| Promise | Implementation |
| --- | --- |
| Free forever | MIT-licensed; no paywall or subscription code |
| No login | No account system, identity provider, or remote profile |
| Local by default | Progress uses `browser.storage.local` with a memory fallback |
| No telemetry | No analytics SDK or tracking endpoint |
| User-controlled backup | Export and import a human-readable JSON backup |
| Honest automation | Automated feedback is labelled as an estimate, not official IELTS scoring |

Opening a user-provided YouTube timestamp is the only Video Lab action that leaves the extension, and only after the learner selects it.

## 🧠 Evidence-informed learning design

The Video Lab combines captioned input, active retrieval, focused feedback, and replay. These choices are grounded in research, but IELTS Slayer does **not** claim clinical efficacy or affiliation with IELTS owners.

- Captioned video has demonstrated benefits for L2 listening and vocabulary learning in meta-analysis: Montero Perez, Van Den Noortgate, & Desmet (2013), *System*, 41(3), 720–739. [doi:10.1016/j.system.2013.07.013](https://doi.org/10.1016/j.system.2013.07.013)
- A newer meta-analysis reports positive incidental vocabulary effects from captioned viewing: Kurokawa, Hein, & Uchihara (2024), *Language Learning*. [doi:10.1111/lang.12697](https://doi.org/10.1111/lang.12697)
- Spaced practice in second-language learning is reviewed by Kim & Webb (2022), *Language Learning*, 72(1), 269–319. [doi:10.1111/lang.12479](https://doi.org/10.1111/lang.12479)
- Repeated dual-subtitled viewing and spacing are examined by Lo (2024), *ReCALL*, 36(2), 152–167. [doi:10.1017/S0958344024000053](https://doi.org/10.1017/S0958344024000053)

See [`docs/RESEARCH.md`](docs/RESEARCH.md) for the product-to-evidence mapping, limitations, and reproducibility notes.

## 🛠️ Technology

- **Platform:** Firefox WebExtension Manifest V3
- **Language:** TypeScript in strict mode
- **UI:** React 19, Tailwind CSS, Lucide, and Meta's open-source [Astryx](https://github.com/facebook/astryx) design system
- **Local analysis:** deterministic transcript parser, essay AST heuristics, AWL lookup, readability metrics, and SM-2 scheduling
- **Testing:** Vitest, React Testing Library, jsdom, and V8 coverage
- **Quality:** ESLint, TypeScript, Super-Linter, and Astryx CLI design guidance

Astryx is used as the accessible component and theme system. The writing **AST** analyzer is a separate local linguistic heuristic; the two should not be confused.

## 🚀 Development

### Requirements

- Node.js 22.13 or newer (required by the Astryx CLI)
- npm 10 or newer

```bash
npm ci
npm test
npm run test:coverage
npm run test:coverage:video   # enforces 100% for the new Video Lab
npm run typecheck
npm run lint
npm run astryx -- doctor
npm run build
```

The production extension is written to `dist/`.

### Load temporarily in Firefox

1. Build with `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Select **Load Temporary Add-on…**.
4. Choose `dist/manifest.json`.

## ✅ Quality policy

The Video Lab ships with **100% statements, branches, functions, and lines coverage**. The repository tracks coverage for the full legacy suite separately and raises it without hiding UI files from reports. Every pull request must pass type checking, ESLint, tests, the production build, Astryx diagnostics, and Super-Linter.

Security and accessibility expectations include semantic controls, keyboard-visible focus, bilingual accessible names, no HTML injection of transcript content, URL host validation, and no remote execution.

## 📚 Citation

If this software supports teaching or research, cite the archived release metadata in [`CITATION.cff`](CITATION.cff). GitHub also exposes this through **Cite this repository**.

## License and trademark notice

Released under the [MIT License](LICENSE). IELTS is a registered trademark of its respective owners. IELTS Slayer is an independent study tool and is not endorsed by, affiliated with, or a substitute for official IELTS materials.
