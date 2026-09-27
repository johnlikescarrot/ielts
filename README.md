# Focus IELTS

> **Free, local-first IELTS practice for Firefox. No account. No cloud sync. No tracking.**

[![CI](https://github.com/johnlikescarrot/ielts/actions/workflows/ci.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/core%20coverage-100%25-0f766e)](./vitest.config.ts)
[![License: MIT](https://img.shields.io/badge/License-MIT-f6bd60.svg)](./LICENSE)
[![Firefox focused](https://img.shields.io/badge/Firefox-focused-ff7139?logo=firefoxbrowser&logoColor=white)](https://www.mozilla.org/firefox/)

Focus IELTS is a polished study companion for deliberate IELTS vocabulary review and self-directed shadowing. It brings the useful principles of keyboard-first, original-context practice into a small, privacy-preserving Firefox extension:

- **Spaced review**, with transparent interval scheduling and keyboard grading.
- **Quick capture** of any useful term, phrase, context, and tag.
- **Shadowing room** with text-to-speech rehearsal, microphone recording, and self-judged outcomes.
- **English and Vietnamese** interfaces; English is the default.
- **Local storage only**—there is no sign-up, server, analytics SDK, remote API, or subscription.
- **Portable backups** so learners own their data.

> [!NOTE]
> Focus IELTS supports practice; it does not represent, endorse, or guarantee results on IELTS or any other exam.

## Why it exists

[IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER) demonstrates a compelling set of learning-product principles: local-first data, context-rich language practice, spaced repetition, shadowing, and keyboard-first flow. Focus IELTS adapts those _ideas_ for a browser-native, login-free Firefox extension. It is an independent project: it does not bundle, copy, or depend on IELTS_SLAYER code or its media pipeline.

The deliberate design boundary is equally important: a study card uses text the learner provides, rehearsal is self-assessed, and no AI score is presented as language expertise.

## Features

### A small review loop that stays out of your way

1. Save a term, a concise meaning, optional source sentence, and tags.
2. Review when the card is due.
3. Press **Space** to reveal, **L** to hear the term, then **1–4** to grade recall.
4. The next interval is calculated locally and visibly from that grade.

| Key     | Action                                             |
| ------- | -------------------------------------------------- |
| `Space` | Reveal the review answer                           |
| `L`     | Speak the prompt through an installed system voice |
| `1`     | Again — revisit in 10 minutes                      |
| `2`     | Hard — shorter interval                            |
| `3`     | Good — standard interval                           |
| `4`     | Easy — longer interval                             |

### Shadowing without a black-box score

The full Studio turns a saved card into a cue. Listen using your system voice, record a local attempt if you grant Firefox microphone permission, replay it, and mark it **I nailed it** or **Needs another pass**. The extension intentionally does **not** claim to assess pronunciation or assign an artificial band score.

### Capture useful language where you find it

Select text on any page, right-click, then choose **Save “…” to Focus IELTS**. The extension creates a local draft card. Open the Studio to replace the placeholder meaning with your own definition and context.

## Privacy and permissions

Focus IELTS is designed to be inspectable and quiet:

| Permission     | Why it is needed                                                                  |
| -------------- | --------------------------------------------------------------------------------- |
| `storage`      | Keeps cards, review history, settings, and shadowing outcomes in Firefox storage. |
| `contextMenus` | Offers the explicit right-click capture command for selected text.                |

There are **no host permissions**, no network destinations, no telemetry, no login, and no external font or script request. Microphone access is only requested after the learner presses **Start recording** in the Studio. Audio remains in the current browser session; it is not uploaded or retained as a cloud recording.

Backups are JSON files created only when the learner selects **Export backup**. Keep them in a safe location: they contain your study cards and review history.

## Install for development (Firefox)

### Prerequisites

- Node.js 22+ (or a current maintained Node release)
- Firefox 121+ for this Manifest V3 configuration

```bash
npm install
npm run build
```

For a temporary local install:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Select **Load Temporary Add-on**.
3. Choose `dist/manifest.json` after building.

For a development preview outside Firefox:

```bash
npm run dev
```

The preview uses the same local-storage fallback; Firefox extension APIs become available when it runs as an add-on.

## Quality gates

Focus IELTS uses [Meta's Astryx design system](https://github.com/facebook/astryx) (`@astryxdesign/core` and the Neutral theme) for accessible, typed UI foundations. Custom CSS deliberately carries the study-specific visual language while Astryx provides its component and theme contract.

```bash
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

`test:coverage` enforces **100% lines, statements, functions, and branches for the deterministic application core**: scheduling, state validation, local persistence, and translation. Browser and visual composition are separately protected by TypeScript, ESLint, production builds, and the Super-Linter CI workflow.

The repository also runs [`super-linter/super-linter`](https://github.com/super-linter/super-linter) in GitHub Actions for pull requests and pushes.

## Architecture

```text
Firefox popup / full Studio (React + TypeScript + Astryx)
                   │
                   ├── domain scheduler and validators (pure, tested)
                   ├── Firefox storage.local adapter
                   ├── context-menu capture service worker
                   └── browser-native speech + optional MediaRecorder
```

Read the detailed engineering notes in [docs/architecture.md](./docs/architecture.md).

## Contributing

Contributions are welcome, especially usability research, accessibility checks, Vietnamese copy improvements, Firefox compatibility testing, and transparent learning-science references. Please read [CONTRIBUTING.md](./CONTRIBUTING.md), run every quality command above, and keep the no-login/local-first boundary intact.

## Cite this project

If Focus IELTS informs academic work, teaching materials, or evaluation, please cite the version you used. Machine-readable metadata is available in [`CITATION.cff`](./CITATION.cff).

## License

[MIT](./LICENSE) © 2026 Focus IELTS contributors.
