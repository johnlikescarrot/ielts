# Architecture and product boundaries

## Non-negotiable boundaries

1. **Learner-owned data:** cards, review state, sessions, and settings live in `browser.storage.local`; backup is readable JSON.
2. **Explicit page access:** text is read only after the learner presses **Capture from page**. There is no persistent content or background script and no host permission.
3. **Honest feedback:** scheduling is deterministic; speaking offers replay and self-rating rather than a fabricated language score.
4. **Fast retrieval:** the review surface supports keyboard reveal and 1–4 ratings.
5. **No remote runtime:** prompts, code, fonts, and study logic ship inside the extension.

These boundaries adapt the local-first, keyboard-first, contextual review, and shadowing ideas documented by [WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER) to Firefox. IELTS Forge is an independent TypeScript implementation.

## Topology

```text
index.html → src/main.tsx → Astryx Theme → React application
                                      │
                                      ├─ four active skill drills
                                      ├─ selection capture adapter
                                      ├─ browser speech and recording APIs
                                      └─ local study domain
                                          ├─ model.ts
                                          ├─ scheduler.ts
                                          ├─ study.ts
                                          └─ backup.ts
                                                   │
                                      browser.storage.local
```

Vite builds one page used as both the toolbar popup and full-tab settings page. The same build can run as an ordinary browser preview, where the storage adapter uses `localStorage` and selection capture returns preview metadata.

## Scheduling

The scheduler is deliberately described as **SM-2-derived**, not FSRS:

- **Again:** reset successful repetitions, add a lapse, reduce ease, and retry in one day.
- **Hard:** use a conservative first interval or multiply a mature interval by 1.2; reduce ease.
- **Good:** use a two-day first interval or multiply by current ease.
- **Easy:** use a four-day first interval or multiply by ease plus 0.35; increase ease.
- Ease is bounded from 1.3 to 3.0.

The model is transparent and deterministic. Replacing it requires state migration, disclosed parameters, tests, and updated learner-facing language.

## Test boundary

Pure domain files under `src/lib` are included in V8 coverage and enforce 100% statements, branches, functions, and lines. Browser composition is protected by strict TypeScript, ESLint, production compilation, Mozilla `web-ext` validation, and manual Firefox interaction testing. This distinction is explicit so a green percentage is not misrepresented as proof that visual or browser behavior cannot fail.

## Security and privacy

The manifest has no host permissions, external connection surface, or background process. Selection injection is constrained by `activeTab`, initiated by the learner, and reads only the current selection and nearby semantic container. React escapes learner-provided text. Persistent data can be reviewed through JSON export and erased in Settings.

Speaking recordings remain temporary object URLs. They are not stored in persistent extension state or transmitted. Firefox mediates microphone consent.
