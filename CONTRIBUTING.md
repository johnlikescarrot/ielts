# Contributing to Bandcraft

Thank you for helping make private, evidence-informed IELTS practice available to everyone.

## Product boundaries

A contribution should preserve these guarantees:

- free and usable without an account;
- English default with complete Vietnamese coverage for user-facing copy;
- no analytics, advertising, trackers, or learner-data transmission;
- no unvalidated automated band-score or pronunciation-score claims;
- low-permission Firefox architecture;
- keyboard and screen-reader accessibility;
- original or clearly licensed learning content.

## Development

Requirements: Node.js 22+.

```bash
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run validate
npm run package
```

`npm run validate` checks formatting, type-aware lint rules, strict TypeScript, 100% test coverage, the production build, and Mozilla's extension linter. CI additionally runs the pinned Super-Linter action.

## Tests

Tests use Vitest, Testing Library, jsdom, and V8 coverage. Every changed executable branch must be exercised; thresholds are 100% for statements, branches, functions, and lines. Do not hide testable behavior with coverage-ignore comments.

## Astryx UI

Bandcraft uses [Meta's Astryx](https://github.com/facebook/astryx). Reuse its semantic components and tokens before creating new primitives. Component documentation is available locally:

```bash
npm run astryx -- component Button --json
npm run astryx -- component --list
```

Use native controls when they improve WebExtension compatibility or accessibility. Keep custom CSS in `src/styles.css` and verify light, dark, narrow sidebar, popup, reduced-motion, and keyboard states.

## Learning content and research claims

- Do not submit leaked or copyrighted exam questions.
- Add the source and limitations for empirical claims to `docs/research.md`.
- Distinguish timing or completion feedback from language assessment.
- Do not promise score gains.

## Commit and pull-request guidance

Keep commits focused and explain:

1. the learner problem;
2. the proposed interaction;
3. privacy and permission impact;
4. accessibility impact;
5. test evidence.

Report security issues according to [`SECURITY.md`](SECURITY.md), not in a public issue.
