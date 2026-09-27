# IELTS Slayer for Firefox

A free, local-first IELTS study companion inspired by the learning loop in [WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER): capture authentic language, review it with spaced repetition, and practise deliberately. No account, server, ads, AI API, or tracking.

Built in TypeScript and React with Meta's [Astryx](https://github.com/facebook/astryx) design system.

## Highlights

- Save selected words and surrounding context from any webpage
- Offline personal vocabulary deck and SM-2-style spaced repetition
- English by default with a Vietnamese interface option
- Speaking, listening/shadowing, and writing practice prompts
- Keyboard shortcut (`Alt+Shift+I`), context menu, speech synthesis
- Data stored only in Firefox local extension storage
- 100% statement, branch, function, and line coverage for domain modules

## Develop

Requires Node.js 20+.

```bash
npm install
npm run check
npm run dev       # browser preview
npm run package   # creates ielts-slayer-firefox.zip
```

### Load in Firefox

1. Run `npm run build`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on** and select `dist/manifest.json`.

## Architecture

- `src/lib/study.ts`: deterministic local scheduling and session domain logic
- `src/background.js`: context menu capture, reminders, and keyboard command
- `src/content.js`: extracts context around the current selection
- `src/App.tsx`: full study studio
- `src/popup.tsx`: compact browser-action dashboard

Astryx reset, component styles, neutral theme, and runtime `Theme` provider are applied globally. Product-specific CSS uses Astryx-compatible semantic layering while preserving a distinctive focused-study visual identity.

## Privacy and permissions

`storage` persists cards locally. `contextMenus` captures selected text only after an explicit user action. `<all_urls>` lets that context-menu workflow work on pages the learner chooses. No data is transmitted.

## Quality

`npm run check` runs ESLint, Vitest with mandatory 100% domain coverage, TypeScript, and a production build. GitHub Actions also runs Super-Linter and the complete quality suite.

## License

MIT
