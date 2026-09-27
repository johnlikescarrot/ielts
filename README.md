# IELTS Sprint

[![Quality](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml/badge.svg)](https://github.com/johnlikescarrot/ielts/actions/workflows/quality.yml)

A free, no-login Firefox extension for focused IELTS practice. Save unfamiliar words from any webpage, review them with a lightweight spaced-repetition scheduler, and keep every card locally in Firefox. English is the default; Vietnamese is included.

## Why this approach

Inspired by [IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER)'s keyboard-first, local-first practice loop: turn authentic context into reviewable cards without AI, accounts, subscriptions, or a backend. IELTS Sprint keeps the useful part frictionless for a browser: select a word, click **＋ IELTS**, then review it later with keyboard-friendly 1–4 ratings.

## Install for development

```bash
npm ci
npm run check
npm run build
```

In Firefox, open `about:debugging` → **This Firefox** → **Load Temporary Add-on…** and choose `dist/manifest.json` after building. The extension is deliberately permission-light and has no network requests.

## Quality and privacy

- TypeScript, strict mode, Firefox Manifest V3.
- 100% line, branch, function, and statement coverage enforced for the deterministic scheduler.
- GitHub Actions runs ESLint, tests, TypeScript, and [Super-Linter](https://github.com/super-linter/super-linter).
- The project references and follows the component-oriented accessibility principles from [Facebook Astryx](https://github.com/facebook/astryx), while avoiding a runtime UI dependency to keep the add-on small and offline-capable.
- No analytics, cookies, login, remote API, or user data collection. MIT licensed.

## Shortcuts

Use `1` to mark Forget, `2` Hard, `3` Good, or `4` Easy while reviewing. The scheduler is deterministic and intentionally transparent: cards are due immediately, then intervals adapt to recall quality.

## Research

Product decisions were informed by the local media, shadowing, keyboard-first, and spaced-repetition workflow documented in [WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER). This extension does not download or redistribute copyrighted media.
