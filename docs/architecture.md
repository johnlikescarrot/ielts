# Architecture and learning-product boundaries

## Product principles

Focus IELTS is built around four non-negotiable decisions:

1. **The learner owns the data.** Cards and review events live in `browser.storage.local`; an export is a human-readable JSON file.
2. **Practice is explicit.** The extension captures selected text only from a learner's explicit context-menu command. It has no content script and no host permissions.
3. **Feedback is honest.** Scheduling is deterministic. Shadowing has playback and a local recording, not an opaque pronunciation score.
4. **The interface is fast.** Review works from the keyboard and keeps the card focused.

These principles were informed by the local-first, keyboard-first and shadowing concepts documented by [WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER). Focus IELTS is a distinct browser extension with its own TypeScript implementation and a deliberately narrower scope.

## Extension topology

```text
manifest.json
 ├─ popup.html → src/popup.tsx → compact React review surface
 ├─ options.html → src/options.tsx → full React Studio
 └─ src/background.ts → service worker / context-menu capture

src/domain/
 ├─ types.ts      → stable state model
 ├─ seed.ts       → useful first-run sample cards
 ├─ scheduler.ts  → pure scheduling and progress operations
 └─ validate.ts   → defensive backup/storage parsing

src/platform/storage.ts → Firefox storage adapter with local preview fallback
src/i18n.ts             → English and Vietnamese message catalog
```

## Scheduling model

The scheduler is intentionally small and explainable—not presented as an implementation of FSRS.

- **Again (1):** schedule in 10 minutes, increment lapse count, enter learning state.
- **Hard (2):** multiply the active interval by 1.2.
- **Good (3):** multiply the active interval by 2.5.
- **Easy (4):** multiply the active interval by 4.
- A first successful review starts from one day. Intervals are rounded to whole days.

This is appropriate for an extension that needs transparent local behavior. Any future move to a more sophisticated model must include migration, disclosed parameters, test cases, and plain-language product copy.

## Local state format

A backup contains an `AppState` object:

```json
{
  "version": 1,
  "cards": [],
  "reviews": [],
  "shadowSessions": [],
  "settings": { "locale": "en", "theme": "light", "dailyGoal": 12 }
}
```

All inbound state—including an imported backup—is parsed defensively. An incompatible object is rejected rather than partially merged.

## Accessibility and localization

- Semantic headings, labels, buttons, form controls, visible focus states, and status messages are built into the UI.
- The review loop offers both pointer targets and keys.
- English is the default locale. Vietnamese is complete for the study surface and persisted as a local setting.
- The UI uses Astryx components and the Neutral theme, with a custom high-contrast study palette.

## Security posture

The production manifest contains no host permissions and no `externally_connectable` endpoint. There are no fetch calls in extension code. The only sensitive browser capability—microphone access—is browser-mediated, user-triggered, and only used inside the Studio. Recorded audio is held as an in-memory object URL for immediate playback and released when the Studio cleanup runs.
