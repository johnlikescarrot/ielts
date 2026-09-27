# IELTS Forge

> Capture English in context. Retrieve it at the right time. Say it aloud.

[![Quality](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml)
[![Coverage: 100%](https://img.shields.io/badge/core%20coverage-100%25-00b894)](./vitest.config.ts)
[![Firefox](https://img.shields.io/badge/Firefox-Manifest%20V3-ff7139?logo=firefoxbrowser&logoColor=white)](./public/manifest.json)
[![Astryx](https://img.shields.io/badge/UI-Astryx-7c5cff)](https://github.com/facebook/astryx)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**IELTS Forge** is a free, private, offline-first Firefox extension for deliberate IELTS practice. It turns useful language found while browsing into contextual flashcards, schedules retrieval with FSRS, and provides a local listen-record-compare shadowing studio. English is the default interface; Vietnamese is fully supported.

There is **no account, subscription, advertising, analytics, cloud backend, or remote AI**. Study data stays in Firefox.

## Why it is different

| Principle                     | Product decision                                                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Context before isolated lists | Save a selected phrase together with its page title, URL, and sentence.                                               |
| Retrieval before rereading    | Every review hides the target; `Space` reveals it and `1`–`4` rates recall.                                           |
| Efficient spacing             | [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) targets 90% retention and stores the schedule locally. |
| Speaking through comparison   | Firefox speech synthesis provides a model; microphone recording enables immediate self-comparison.                    |
| Privacy as architecture       | Only `activeTab`, `contextMenus`, `scripting`, and `storage` permissions; no host access and no network service.      |
| Accessible, coherent UI       | React 19 uses Meta's [`facebook/astryx`](https://github.com/facebook/astryx) components and Neutral theme.            |

## Features

- **One-click browser capture** from selected text through the toolbar popup or context menu.
- **Contextual FSRS deck** with deterministic local scheduling and keyboard-first review.
- **Four-skill labels** for Reading, Listening, Writing, and Speaking.
- **Shadowing studio** using browser-native speech and microphone APIs—audio remains temporary.
- **Personal language vault** with search, filtering, source links, deletion, and JSON backup/restore.
- **Daily command centre** with due cards, learned cards, streak, and configurable target.
- **English and Vietnamese** UI, with English selected on first launch.
- **New-tab studio** plus compact toolbar popup.
- **Responsive and reduced-motion aware** interface.

## Install in Firefox for development

Requirements: Node.js 22+ and Firefox 142+.

```bash
npm ci
npm run check
```

Then open `about:debugging` → **This Firefox** → **Load Temporary Add-on** and choose `dist/manifest.json`.

To create a signed-ready ZIP artifact:

```bash
npm run package
```

## Development

```bash
npm run dev             # browser preview at http://localhost:4173/dashboard.html
npm run typecheck       # strict TypeScript
npm run lint            # ESLint (type-aware)
npm run test:coverage   # 100% lines/functions/statements/branches for core + i18n
npm run build           # production extension + Mozilla web-ext validation
npm run check           # every local quality gate
```

Super-Linter runs in GitHub Actions with `super-linter/super-linter/slim@v8.7.0`. If Docker is available locally, run `npm run lint:super`.

## Keyboard controls

| Key     | Review action     |
| ------- | ----------------- |
| `Space` | Reveal the answer |
| `1`     | Again             |
| `2`     | Hard              |
| `3`     | Good              |
| `4`     | Easy              |

## Architecture

```text
Firefox selection / context menu
              │
              ▼
       capture + normalize
              │
              ▼
 browser.storage.local ◄── JSON backup / restore
              │
       contextual cards
        ┌─────┴─────┐
        ▼           ▼
   FSRS review   shadowing studio
   (ts-fsrs)     (Speech + MediaRecorder)
```

See [Architecture](./docs/ARCHITECTURE.md), [research rationale](./docs/RESEARCH.md), [privacy](./docs/PRIVACY.md), and the detailed [IELTS_SLAYER study](./docs/IELTS_SLAYER_ANALYSIS.md).

## Origin and attribution

The product loop was informed by the MIT-licensed [`WeFode/IELTS_SLAYER`](https://github.com/WeFode/IELTS_SLAYER): original-media context, FSRS review, keyboard operation, and listen-record-compare shadowing. IELTS Forge is an independent WebExtension implementation designed for browser-native, serverless use. No source code was copied.

The interface directly integrates the MIT-licensed [`@astryxdesign/core`](https://www.npmjs.com/package/@astryxdesign/core) and [`@astryxdesign/theme-neutral`](https://www.npmjs.com/package/@astryxdesign/theme-neutral) packages.

## Responsible claims

This project is evidence-informed but does not promise an IELTS band score. Research findings vary by learner, task, spacing schedule, and study quality. The citations explain design choices rather than claiming clinical or exam-outcome validation of this extension.

## License

[MIT](./LICENSE)
