<div align="center">
  <img src="public/icons/icon-96.svg" width="88" height="88" alt="IELTS Forge logo" />
  <h1>IELTS Forge</h1>
  <p><strong>Turn the web into a private IELTS practice studio.</strong></p>
  <p>Free forever · No login · English + Tiếng Việt · Local-first</p>

[![Quality](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml)
[![Coverage](https://img.shields.io/badge/core%20coverage-100%25-36b37e)](#quality)
[![Firefox](https://img.shields.io/badge/Firefox-115%2B-ff7139?logo=firefox-browser&logoColor=white)](https://www.mozilla.org/firefox/)
[![License: MIT](https://img.shields.io/badge/license-MIT-7adfb3)](LICENSE)

</div>

## Why IELTS Forge?

Most study products begin with an account, a subscription, or a black-box score. IELTS Forge begins with a **five-minute task**. It is a Firefox extension that combines retrieval practice, spaced review, deliberate self-comparison, and short mixed-skill drills without sending study data anywhere.

- **Four-skill circuit:** focused listening transcription, main-claim reading, timed writing, and record/compare speaking.
- **Web → memory:** select authentic English on the current page and turn it into a contextual review card.
- **Transparent spaced review:** keyboard-friendly Again / Hard / Good / Easy ratings using an inspectable SM-2-derived scheduler.
- **Local progress:** daily goal, streak, session history, personal phrase library, and JSON backup.
- **Bilingual interface:** English by default, with complete Vietnamese UI support.
- **Radically private:** no login, backend, ads, analytics, trackers, remote AI, or host permissions.

> IELTS Forge is an independent practice tool. It is not affiliated with, approved by, or endorsed by IELTS, Cambridge University Press & Assessment, the British Council, or IDP Education.

## Product principles

This extension was developed after a detailed review of [WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER). Its strongest ideas—local-first study, authentic context, blind keyboard review, spaced repetition, and original-versus-self speaking comparison—were adapted to the constraints and strengths of a browser extension.

Unlike the source project, Forge needs no Go service, PostgreSQL, Redis, FFmpeg, `yt-dlp`, or self-hosting. Firefox storage replaces the backend; browser speech and recording APIs support instant drills; selected page text supplies authentic context. This preserves the fast, private learning loop while making installation accessible to non-technical learners.

The interface uses Meta's open-source [Astryx](https://github.com/facebook/astryx) design system and its accessible React primitives. Astryx is a runtime dependency, its CLI is part of the development toolchain, and its neutral theme provides the token foundation.

## Install for development

Requirements: Node.js 20.19+ and Firefox 115+.

```bash
git clone https://github.com/johnlikescarrot/ielts.git
cd ielts
npm ci
npm run build
```

Load the extension temporarily:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Choose **Load Temporary Add-on**.
3. Select `dist/manifest.json`.
4. Select English text on a web page and open IELTS Forge from the toolbar.

Create a distributable archive with `npm run package`. The output is `ielts-forge-firefox.zip`.

## Commands

| Command                              | Purpose                                         |
| ------------------------------------ | ----------------------------------------------- |
| `npm run dev`                        | Preview the interface in a browser              |
| `npm run build`                      | Type-check and create the extension in `dist/`  |
| `npm test`                           | Run unit tests with enforced 100% core coverage |
| `npm run lint`                       | Run ESLint with zero warnings allowed           |
| `npm run format:check`               | Check formatting with Prettier                  |
| `npm run check`                      | Run format, lint, tests, coverage, and build    |
| `npm run package`                    | Build a Firefox-ready ZIP                       |
| `npm run astryx -- component Button` | Query the Astryx component reference            |

## Quality

The domain layer—backup parsing, text scoring, study tracking, streaks, and scheduling—is tested at **100% statements, branches, functions, and lines**. Thresholds are hard failures in `vitest.config.ts`.

Every push and pull request runs:

1. formatting and ESLint;
2. 100%-threshold Vitest coverage;
3. strict TypeScript and production build;
4. dependency vulnerability audit;
5. packaging; and
6. [`super-linter/super-linter`](https://github.com/super-linter/super-linter) v8.7.0.

## Permissions and privacy

| Permission  | Why it is needed                                                                  |
| ----------- | --------------------------------------------------------------------------------- |
| `storage`   | Save cards, settings, and practice history locally in Firefox                     |
| `activeTab` | Access only the page the learner explicitly invokes the extension on              |
| `scripting` | Read the learner's current text selection after they choose **Capture from page** |

There are no host permissions and no background process. The extension cannot continuously read browsing history. Microphone access is requested by Firefox only when the learner starts a speaking recording. See [Privacy](docs/PRIVACY.md).

## Evidence, not score promises

The learning design is grounded in research on retrieval practice, distributed practice, interleaving, and feedback. The speaking feature deliberately asks learners to compare and self-rate instead of pretending to provide an authoritative pronunciation or IELTS band score. See [Research notes](docs/RESEARCH.md) for the rationale and scholarly references.

No software can guarantee a band score. Official IELTS assessment criteria and realistic practice with qualified feedback should remain part of a serious study plan.

## Architecture

```text
Firefox popup / options page
       │
       ├── Astryx + React interface
       ├── four-skill active drills
       ├── Web Speech / MediaRecorder
       │
       └── local study domain
            ├── contextual cards
            ├── deterministic scheduler
            ├── progress and streaks
            └── import / export
                    │
              browser.storage.local
```

The production extension is Manifest V3 and contains no remotely hosted code. See [Architecture and product boundaries](docs/ARCHITECTURE.md) for the scheduler, test boundary, and security model.

## Contributing

Issues and pull requests are welcome. Please keep the product free, login-free, local-first, bilingual, and accessible. New domain logic must include tests that preserve all four 100% coverage thresholds. Run `npm run check` before submitting a change and read [CONTRIBUTING.md](CONTRIBUTING.md).

## Citation

If IELTS Forge informs research, teaching, or product evaluation, cite the version used. Machine-readable metadata is available in [`CITATION.cff`](CITATION.cff), and the scholarly basis is documented in [Research notes](docs/RESEARCH.md).

## License

[MIT](LICENSE). Astryx is used under its own MIT license. IELTS-related names and trademarks belong to their respective owners.
