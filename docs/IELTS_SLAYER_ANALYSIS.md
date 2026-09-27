# IELTS_SLAYER analysis and WebExtension adaptation

Studied repository: [`WeFode/IELTS_SLAYER`](https://github.com/WeFode/IELTS_SLAYER), commit `d20312a` (observed 27 September 2026), MIT license.

## What the source project does

IELTS_SLAYER is a self-hosted GoFrame + React application organized around five surfaces:

1. **Command centre** — health, review queue, imported media, YouTube import.
2. **Vault** — indexed local/YouTube media.
3. **Immersive player** — synchronized subtitles, seeking, word selection, and clip creation.
4. **Slash review** — FSRS queue with `Space` reveal/replay and `1`–`4` grading.
5. **Shadow studio** — sentence A–B loops, hold-to-record, dual WaveSurfer tracks, self-assessment, and a weak-sentence queue.

Its backend uses PostgreSQL and Redis, `yt-dlp` for media/subtitles, FFmpeg for clips, `go-astisub` for subtitle parsing, and `go-fsrs` for scheduling. The web application uses React 19, Vite, TanStack Query, WaveSurfer, and Chinese/English i18n. The documented design is dark, amber-led, monospace, compact, and keyboard-first.

The repository had no automated test files in the observed checkout. IELTS Forge therefore treats the concept—not its implementation—as the research input and establishes its own strict test and extension-security baseline.

## Product ideas retained

| IELTS_SLAYER idea                             | IELTS Forge form                                               |
| --------------------------------------------- | -------------------------------------------------------------- |
| Language remains attached to original context | Selection, page metadata, and sentence are one card.           |
| FSRS controls review timing                   | Browser-compatible `ts-fsrs`, 90% requested retention.         |
| `Space` then `1`–`4` keyboard loop            | Same compact retrieval flow.                                   |
| Model-versus-self listening                   | Browser speech synthesis and a temporary microphone recording. |
| No AI on the core path                        | No remote model or generated assessment.                       |
| Local-first data ownership                    | Firefox local storage plus JSON export/import.                 |
| Dark, amber, keyboard-first UI                | Adapted visual direction implemented through Astryx.           |

## Deliberate changes

### Server stack → extension-native storage

PostgreSQL, Redis, GoFrame, Docker, FFmpeg, and a local daemon would make a Firefox extension difficult to install and impossible to use immediately. The extension stores a versioned state object in `browser.storage.local` and performs all domain transformations client-side.

### YouTube download → user-controlled page capture

Bundling `yt-dlp` or downloading third-party media from an extension creates platform-policy, copyright, binary-distribution, and security problems. IELTS Forge captures only text the user explicitly selects. A saved source URL can be reopened, but content is not copied or redistributed.

### Downloaded media clips → browser-native speech

The model track uses `SpeechSynthesisUtterance`; the learner track uses `MediaRecorder`. This is less acoustically authentic than an original film clip but needs no media pipeline, account, server, or copyrighted asset. The UI explicitly calls this self-comparison, not pronunciation scoring.

### Chinese localization → Vietnamese localization

The requested release defaults to English and ships Vietnamese. Locale is a user setting persisted with study state.

### shadcn → Astryx

The interface uses `@astryxdesign/core@0.6.3`, `@astryxdesign/theme-neutral@0.6.3`, React 19, and Astryx's `Theme`, `Button`, `Card`, `Badge`, `Heading`, `Text`, `TextInput`, `ProgressBar`, and `EmptyState` primitives. Application CSS supplies the product-specific dark forge visual language without forking the design system.

## Constraints inherited thoughtfully

“Fast,” “scientific,” and “private” are treated as engineering objectives, not marketing absolutes. FSRS is an optimization model, self-comparison is not an objective pronunciation score, and no software can guarantee an IELTS band. The extension communicates those limits in Settings, the README, and the research notes.
