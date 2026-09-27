<div align="center">
  <img src="public/icons/icon.svg" width="88" alt="Bandcraft logo" />

# Bandcraft

**A private, local-first IELTS practice studio inside Firefox.**

Train vocabulary, reading, writing, listening, and speaking without an account, subscription, AI API, or data upload.

[![Quality](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](#quality)
[![Firefox](https://img.shields.io/badge/Firefox-142%2B-ff7139?logo=firefoxbrowser&logoColor=white)](#install-in-firefox)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Astryx](https://img.shields.io/badge/UI-Astryx-6741d9)](https://github.com/facebook/astryx)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[Features](#what-you-can-do) · [Install](#install-in-firefox) · [Research](docs/research.md) · [Privacy](PRIVACY.md) · [Contribute](CONTRIBUTING.md)

</div>

---

## Why Bandcraft?

Most exam tools ask for an account, upload private writing or voice recordings, or put useful practice behind a paywall. Bandcraft takes the opposite approach:

- **Free forever:** MIT-licensed, with no paid tier.
- **No login:** open the extension and practise immediately.
- **Local-first:** study history stays in Firefox extension storage.
- **No AI dependency:** no token cost, waiting, hallucinated band score, or opaque pronunciation grade.
- **English by default, Vietnamese included:** change language at any time in Settings.
- **Low-permission:** no blanket access to every website. Page text is read only after an explicit toolbar or context-menu action.

## What you can do

### Today dashboard

Follow a small daily plan, track minutes and streaks, and see the vocabulary queue that needs attention instead of an overwhelming course catalogue.

### FSRS vocabulary review

Save a word or phrase from any page, add your own meaning, and review it with the open-source Free Spaced Repetition Scheduler. Use `Space` to reveal and `1`–`4` to rate **Again / Hard / Good / Easy**.

### Reading capture

Select useful text on a web page and choose **Save selection to Bandcraft** from Firefox's context menu. Short selections automatically become vocabulary cards; longer selections remain in the reading vault with their source.

### Timed writing sprint

Practise original Academic Task 1, General Training Task 1, and Task 2 prompts. Bandcraft provides a timer, live word count, autosaved local drafts, and a self-check against the four official assessment lenses. It does **not** invent a band score.

### Speaking lab

Use original Part 2 cue cards, one-minute preparation and two-minute response timers, local microphone recording, and a four-criterion self-review checklist.

### Listening and shadowing lab

Import audio plus `.srt` or `.vtt` subtitles from your device. Move sentence by sentence, loop an A–B segment, record your imitation, replay both tracks, and compare timing. Files and recordings are never uploaded.

### Backup and restore

Export all durable study data as readable JSON and restore it on another Firefox profile. Imported audio remains intentionally session-only to avoid silently filling storage with large media.

## Product principles

Bandcraft adapts the strongest local-learning ideas found during a source-level review of [WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER): contextual vocabulary, FSRS scheduling, keyboard-first review, subtitle-aligned practice, and listen–imitate–compare shadowing. It redesigns those ideas for a low-permission Firefox extension and removes server, database, Redis, FFmpeg, `yt-dlp`, and account requirements.

See [`docs/research.md`](docs/research.md) for the review matrix, evidence, design decisions, limitations, and full references.

## Install in Firefox

### Temporary development install

Requirements: Node.js 22+ and Firefox 142+.

```bash
git clone https://github.com/johnlikescarrot/ielts.git
cd ielts
npm ci
npm run build
```

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Select **Load Temporary Add-on…**.
3. Choose `dist/manifest.json`.
4. Pin Bandcraft to the toolbar, or open it from Firefox's sidebar menu.

Temporary add-ons disappear when Firefox restarts. Use `npm run package` to create the installable archive in `artifacts/`.

### Development preview

```bash
npm run dev
```

The web preview uses `localStorage` as a development fallback. Packaged Firefox builds use `browser.storage.local`.

## Keyboard workflow

| Context    | Key     | Action            |
| ---------- | ------- | ----------------- |
| Vocabulary | `Space` | Reveal the answer |
| Vocabulary | `1`     | Again             |
| Vocabulary | `2`     | Hard              |
| Vocabulary | `3`     | Good              |
| Vocabulary | `4`     | Easy              |

All core controls use semantic HTML and visible keyboard focus. Motion is disabled when the operating system requests reduced motion.

## Architecture

```text
Explicit page selection ──► Firefox background event
                                  │
                                  ▼
React 19 + Astryx UI ──► typed study model ──► browser.storage.local
          │                       │
          │                       └──► ts-fsrs scheduler
          │
          ├──► MediaRecorder (local speaking/shadowing)
          └──► local audio + SRT/VTT parser (session only)
```

- **Firefox Manifest V3:** event background script and sidebar/action/options surfaces.
- **TypeScript strict mode:** application, extension background, build configuration, and tests.
- **[Astryx](https://github.com/facebook/astryx):** accessible React components, neutral theme, and design tokens.
- **Minimal permissions:** `activeTab`, `contextMenus`, `scripting`, and `storage`; no host permissions.
- **Explicit data declaration:** `data_collection_permissions.required: ["none"]`.

## Quality

The project enforces 100% statements, branches, functions, and lines across the application, React views, hooks, extension background, and domain modules.

```bash
npm run validate
```

That command runs:

1. Prettier formatting checks
2. ESLint with type-aware TypeScript rules
3. TypeScript strict type checking
4. Vitest and V8 coverage thresholds at 100%
5. Production build
6. Mozilla `web-ext lint`

CI also runs the pinned [`super-linter/super-linter@v8.7.0`](https://github.com/super-linter/super-linter) action over TypeScript, HTML, JSON, Markdown, YAML, shell, and GitHub Actions files.

## Privacy and permissions

| Permission     | Why it is needed                                                      |
| -------------- | --------------------------------------------------------------------- |
| `activeTab`    | Read the current selection only after the toolbar button is activated |
| `scripting`    | Execute the small selection reader in that active tab                 |
| `contextMenus` | Add the explicit “Save selection” action                              |
| `storage`      | Keep study data locally in Firefox                                    |

Bandcraft contains no analytics, ads, trackers, remote API client, or account code. Read the concise [`PRIVACY.md`](PRIVACY.md).

## Citation

If Bandcraft supports teaching or research, cite the archived version you used. Machine-readable metadata is in [`CITATION.cff`](CITATION.cff).

```bibtex
@software{bandcraft2026,
  title   = {Bandcraft: A Local-First IELTS Practice Studio for Firefox},
  year    = {2026},
  url     = {https://github.com/johnlikescarrot/ielts},
  license = {MIT}
}
```

## Disclaimer

Bandcraft is an independent study aid. It is not affiliated with, approved by, or endorsed by IELTS, Cambridge University Press & Assessment, the British Council, or IDP Education. IELTS is a registered trademark of its owners. No feature predicts or guarantees an exam result.

## License

[MIT](LICENSE) © 2026 Bandcraft contributors.
