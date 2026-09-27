# IELTS Compass

A free, private, local-first Firefox companion for deliberate IELTS practice. No login, subscription, ads, analytics, AI dependency, or remote backend.

## Why this approach

IELTS Compass was informed by a detailed review of [WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER). That project has an excellent learning loop: capture language in authentic context, retrieve it through spaced practice, compare spoken output with a model, and make keyboard interaction fast. It is, however, a self-hosted Go/React system that requires PostgreSQL, Redis, FFmpeg, and yt-dlp. Compass translates its strongest ideas into a zero-setup Firefox extension:

| IELTS_SLAYER insight          | Compass adaptation                                                                      |
| ----------------------------- | --------------------------------------------------------------------------------------- |
| Context-rich FSRS cards       | One-click/context-menu capture and an offline review queue                              |
| Keyboard-first review         | `Space` reveals; `1–4` rates recall                                                     |
| Shadowing and self-comparison | Timed speaking prompts, browser read-aloud, planning, and examiner-criterion self-check |
| Command center                | A calm daily dashboard with due work, streak, time, and four-skill balance              |
| Local-first privacy           | Browser-only storage; no servers or accounts                                            |

The result deliberately avoids copying its implementation or visual identity. It also expands scope from vocabulary/listening/speaking into balanced practice across all four assessed skills.

## Product highlights

- **Daily command center** with due cards, practice balance, streak and quick capture.
- **Evidence-led retrieval loop** with a deterministic, inspectable spaced scheduler.
- **Speaking Part 2** and **Writing Task 2** workspaces with timers and the public IELTS assessment dimensions.
- **Bilingual UI**: English by default and complete Vietnamese support.
- **Firefox-native capture**: select text on a page and use the context menu.
- **Accessible, responsive interface** built with Meta's open-source [Astryx](https://github.com/facebook/astryx) design system.
- **User-owned data** with JSON export and no network service.
- **100% tested core**: statements, branches, functions and lines are all enforced at 100%.

## Keyboard workflow

| Key           | Review action             |
| ------------- | ------------------------- |
| `Space`       | Reveal the answer         |
| `1`           | Again                     |
| `2`           | Hard                      |
| `3`           | Good                      |
| `4`           | Easy                      |
| `Alt+Shift+I` | Open Compass from Firefox |

## Development

Requirements: Node.js 22+ and npm.

```bash
npm ci
npm run dev
npm run check
npx web-ext lint --source-dir dist
```

Build the unpacked extension:

```bash
npm run build
```

Then open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and select `dist/manifest.json`.

### Quality gates

`npm run check` runs ESLint, Prettier, Vitest with mandatory 100% core coverage, TypeScript, and a production build. CI additionally runs `web-ext lint` and the official `super-linter/super-linter` slim image. The repository's Super-Linter workflow validates TypeScript, JavaScript, JSON, Markdown, and YAML.

## Architecture

```text
Firefox action / context menu
           │
           ▼
React 19 + Astryx UI ── localStorage / browser.storage.local
           │
           ├── pure bilingual message catalog
           ├── spaced retrieval scheduler
           ├── timed speaking/writing workspaces
           └── portable JSON backup
```

- `src/core/` contains deterministic learning, localization, and persistence logic.
- `src/App.tsx` composes the dashboard and practice workspaces.
- `src/background.ts` owns Firefox context-menu and command integration.
- `public/manifest.json` is the Firefox Manifest V3 declaration.

## Research and assessment grounding

The design uses spaced retrieval rather than passive rereading. Reviews of applied learning research consistently find benefits from combining spacing and retrieval practice. Productive practice is organized around the official public IELTS dimensions: task response/achievement, coherence and cohesion, lexical resource, grammatical range and accuracy, fluency, and pronunciation. Compass offers practice scaffolding and self-reflection—not score prediction or a substitute for a qualified examiner.

## Privacy, cost, and license

Compass is free software under the [MIT License](LICENSE). See [PRIVACY.md](PRIVACY.md). All practice data remains in the browser unless the user explicitly exports it.

IELTS is a trademark of its respective owners. This independent project is not endorsed by or affiliated with IELTS, the British Council, IDP Education, or Cambridge University Press & Assessment.
