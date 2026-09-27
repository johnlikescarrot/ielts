# Contributing to IELTS Forge

Thank you for helping make deliberate, private language practice more approachable.

## Product commitments

- Keep the extension free and login-free.
- Do not add analytics, tracking pixels, remote code, advertising, or a required proprietary API.
- Preserve English as the default and update Vietnamese alongside new visible English copy.
- Do not claim a band score, pronunciation score, or guaranteed result.
- Prefer the existing [Astryx](https://github.com/facebook/astryx) foundation over a second component system.
- Keep Firefox permissions minimal and explain every permission in the README and privacy policy.
- Make all primary study actions keyboard operable and accessible.

## Local checks

Use Node.js 20.19 or later.

```bash
npm ci
npm run check
npm audit --audit-level=moderate
npm run astryx -- doctor
```

The core coverage gate is strict: covered lines, branches, functions, and statements must remain at 100%. Add tests for every domain behavior and backup-format change.

## Pull requests

Explain learner impact, accessibility impact, privacy impact, and the evidence behind consequential learning-design changes. Keep changes focused and update documentation when product behavior, permissions, data shape, or architecture changes. GitHub Actions runs the full quality suite and [Super-Linter](https://github.com/super-linter/super-linter).
