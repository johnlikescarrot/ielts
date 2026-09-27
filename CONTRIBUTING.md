# Contributing to Focus IELTS

Thank you for helping make deliberate, private language practice more approachable.

## Product rules

- Keep the extension free to use and login-free.
- Do not add analytics, tracking pixels, remote code, or a dependency on a proprietary AI API.
- Preserve English as the default locale and update Vietnamese copy alongside new visible English copy.
- Do not claim a band score, a pronunciation score, or a guaranteed test outcome.
- Use the existing Astryx-based design foundation before introducing a second component system.

## Local checks

```bash
npm install
npm run lint
npm run format:check
npm run test:coverage
npm run build
```

The core coverage gate is intentionally strict: every covered line, branch, function, and statement must remain at 100%.

## Pull requests

- Explain learner impact and privacy impact.
- Add or update tests for all domain and persistence behavior.
- Keep the Firefox manifest permissions minimal.
- Make UI changes keyboard-operable and localize every new string.
- GitHub Actions runs Super-Linter automatically.
