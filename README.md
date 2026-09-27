# IELTS Slayer

A free, private, offline-first Firefox WebExtension for IELTS practice. No login, tracking, or server: choose a prompt, practise for five minutes, and build a daily streak. English is the default; Vietnamese is included.

## Features
- Reading, listening, writing, and speaking micro-prompts
- One-click five-minute practice logging with a 25-minute daily goal
- English and Vietnamese UI
- Data stored locally in Firefox only
- Keyboard-friendly, small popup, no remote dependencies

## Development
```sh
npm ci
npm test                 # 100% thresholds for the tested TypeScript core
npm run build            # creates dist/ for temporary Firefox loading
```

Load `dist/` at `about:debugging` → This Firefox → Load Temporary Add-on. The project also runs Super-Linter and ASTRYX analysis in CI. The initial concept was informed by the referenced IELTS_SLAYER project, while this implementation deliberately keeps the core flow local, login-free, and extension-native.
