# Architecture

## Goals

IELTS Forge is deliberately small, local, and inspectable. The extension must work without authentication or a backend; request the least Firefox access needed; preserve all user-created data; and keep the learning algorithm separate from browser and React code.

## Runtime surfaces

| Surface           | Entry point                   | Responsibility                                                                                |
| ----------------- | ----------------------------- | --------------------------------------------------------------------------------------------- |
| Toolbar popup     | `src/apps/popup/main.tsx`     | Read the current selection under `activeTab`, create a card, show due count, open the studio. |
| New-tab studio    | `src/apps/dashboard/main.tsx` | Command centre, review, shadowing, library, settings, backup and restore.                     |
| Event page        | `src/background/main.ts`      | Register the selection context menu and maintain the due-card badge.                          |
| Domain core       | `src/core/`                   | Normalization, card state, FSRS adapter, selectors, backup validation, serialized repository. |
| Platform adapters | `src/platform/`               | Firefox storage/tabs/scripting and browser-preview fallback.                                  |

## Data model

`AppState` is a single versioned value under `ielts-forge-state-v1` in `browser.storage.local`.

- `settings`: locale and daily review target.
- `cards`: prompt, answer, context, skill, optional source, creation time, serialized FSRS card.
- `reviews`: rating, review time, and next due time.

All dates cross the persistence boundary as ISO 8601 strings. `scheduler.ts` is the only module that maps between the persisted representation and `ts-fsrs` `Date` objects.

## Concurrency

Popup, dashboard, and background pages can write concurrently. `PracticeRepository` serializes transactions within each runtime and performs load-transform-save operations. Firefox storage change events refresh the action badge. Duplicate captures use normalized prompt, context, and source URL as a stable fingerprint.

A future multi-device sync mode would require optimistic revision numbers or an append-only review log. It is intentionally absent today because Firefox Sync changes the privacy and quota model.

## Security and privacy boundaries

- There are no host permissions or content scripts.
- Selection reading uses `activeTab` and a one-shot `scripting.executeScript` call after the toolbar action.
- Context-menu capture receives Firefox's `selectionText`; it does not inspect the document.
- The content security policy allows local scripts only and disables objects.
- No remote script, model, font, analytics endpoint, or API is loaded.
- Imported backups are parsed and structurally checked before replacing state.
- Source text renders through React text nodes, never app-owned `innerHTML`.

Mozilla's static linter can report `innerHTML` use inside compiled React/Astryx vendor code. Application code does not assign untrusted markup; those vendor warnings are reviewed rather than hidden.

## Build

Vite builds the two React HTML entries. A small esbuild pass emits a self-contained IIFE for Firefox's background `scripts` entry. `web-ext lint` validates the final `dist/` tree.

## Testing policy

Vitest enforces 100% branch, function, line, and statement thresholds over `src/core/**/*.ts` and `src/i18n/**/*.ts`. These directories contain all durable state transformations, scheduling boundaries, parsing, selectors, repository serialization, and language behavior. Thin browser/React bindings are type-checked, ESLint-checked, production-built, and validated by `web-ext`.
