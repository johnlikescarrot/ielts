# 🏹 IELTS Slayer — Free, Private IELTS Preparation for Firefox

[![CI](https://github.com/johnlikescarrot/ielts/actions/workflows/ci.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/ci.yml)
[![Super-Linter](https://github.com/johnlikescarrot/ielts/actions/workflows/super-linter.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/super-linter.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**IELTS Slayer** is a TypeScript Firefox extension for serious IELTS practice without an account, subscription, API key, telemetry, or remote learner profile. English is the default interface language; every workflow also supports Vietnamese.

> **Tiếng Việt:** IELTS Slayer là tiện ích Firefox luyện IELTS miễn phí, không cần đăng nhập và lưu dữ liệu học tập ngay trên thiết bị. Chuyển sang **VI 🇻🇳** trong thanh điều hướng để dùng giao diện tiếng Việt.

## ✨ What makes it different

### New in 1.2 — Private Shadowing Studio and local replay

#### Original-speaker local replay

The Video Lab can now pair a local SRT, VTT, or TXT transcript with the learner's own audio or video file. Caption files are read in-browser, media is exposed only through a temporary object URL, and every URL is revoked when its source is replaced or the lab closes. During a lesson, the same cue button now seeks the original speaker, plays at 0.75×–1.25×, and stops at the next caption boundary; browser speech remains the zero-setup fallback.

This workflow came from a close product and code review of [`Hossein-Mosaffa/shadowing-player`](https://github.com/Hossein-Mosaffa/shadowing-player) at commit `0fa7f96903675d896a69a061e94db4dae3780792`. IELTS Slayer adopts its strongest local-file interaction while adding cue-aligned replay, bilingual guidance, stale-read protection, explicit file limits, deterministic tests, and extension-safe object-URL cleanup. No source code was copied.

#### Video Lab foundation (introduced in 1.1)

Turn the captions from almost any English video into active IELTS practice:

1. Paste a transcript or open a local SRT, VTT, or TXT caption file.
2. Optionally pair it with a local audio/video file and generate a deterministic listening cloze entirely on-device.
3. Replay the original local-media cue, use browser speech as a fallback, or open a YouTube source at its exact timestamp.
4. Retrieve the missing words and receive immediate answer feedback.
5. Review detected Academic Word List terms with English and Vietnamese definitions.

No transcript is uploaded. No generative-AI output is presented as an official IELTS question. The parser accepts common caption formats, strips caption markup, caps lesson size safely, and produces the same lesson from the same input.

The workflow was informed by the open-source [`Libailin222/ielts-video-assistant`](https://github.com/Libailin222/ielts-video-assistant), while deliberately replacing its server and LLM dependency with a private, zero-configuration local engine suited to a browser extension.

#### Guided shadowing loop

The Video Lab now turns its timestamped captions into a focused speaking loop, inspired by a product review of [`Hossein-Mosaffa/shadowing-player`](https://github.com/Hossein-Mosaffa/shadowing-player) (MIT). The implementation is original TypeScript and keeps the extension's local-first model:

1. Select a 3, 5, 8, or 12 second caption turn and jump through a visible practice queue.
2. Replay the original local-media turn at its exact caption boundaries, or play the browser's on-device model voice at 0.7×–1.15× for one to three repetitions.
3. Record, replay, and optionally download a private shadowing take; microphone audio is never uploaded or stored as learner analytics.
4. Use <kbd>Space</kbd> to play or stop, <kbd>←</kbd>/<kbd>→</kbd> to change turns, and <kbd>R</kbd> to cycle pace when focus is not in a control.
5. Open the learner-supplied YouTube source at the active timestamp only when explicitly selected.

The studio uses Astryx sections, grids, stacks, buttons, status, and keyboard-hint components; responsive grids reduce from two regions to one without narrowing the speaking prompt below a readable width. See [`docs/SHADOWING_STUDIO.md`](docs/SHADOWING_STUDIO.md) for the interaction, privacy, layout, and evidence contract.

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
| Local by default | Progress uses `browser.storage.local`; subtitle bytes and media object URLs never leave the tab |
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
