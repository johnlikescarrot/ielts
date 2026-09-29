# Shadowing Studio: interaction and design contract

## Purpose

Shadowing Studio is the speaking-practice stage of Video Lab. It converts local timestamped transcript cues into short, repeatable turns. It is a study aid, not pronunciation scoring, an IELTS assessment, or a claim that a browser voice matches the source speaker.

The feature was informed by a product review of [Hossein-Mosaffa/shadowing-player](https://github.com/Hossein-Mosaffa/shadowing-player), an MIT-licensed, single-file player focused on chunked playback, replay, pace controls, and keyboard shortcuts. IELTS Slayer uses an original React/TypeScript implementation; no source code from that project was copied.

## Learning loop

1. **Select a turn.** `createShadowingChunks` joins adjacent captions into a 3, 5, 8, or 12 second speaking window. A learner can also select any turn from the queue.
2. **Listen.** The browser `speechSynthesis` voice reads the active turn locally at 0.7×, 0.85×, 1×, or 1.15×. The learner selects one to three repetitions.
3. **Shadow.** The learner speaks along with or immediately after the model.
4. **Record and compare.** `MediaRecorder` captures a take only after an explicit microphone interaction. A take can be replayed or downloaded by the learner.
5. **Revisit or continue.** Previous/next controls, a persistent queue, and an optional YouTube timestamp link support targeted repetition before vocabulary review.

The model voice is deliberately labelled as a browser voice rather than original source audio. The optional link opens a learner-supplied YouTube source in a new tab; the extension does not fetch, embed, transcribe, or proxy video media.

## Privacy and data boundary

- Captions are pasted by the learner and parsed locally.
- The browser voice, speech loop state, and practice queue are in-memory UI state.
- Microphone permission is requested only when **Start shadow recording** is selected.
- A recording remains a temporary `Blob` URL in the current page. It is not sent to a server, put in extension storage, or used for telemetry.
- Downloading is a learner-initiated browser action. Closing the view revokes the temporary object URL.
- There is no login, account, remote profile, speech-to-text, automatic pronunciation score, or generative-AI dependency.

## Layout and Astryx contract

The implementation follows the Astryx layout guidance before adding page content.

| Region | Component and sizing rule | Responsive contract |
| --- | --- | --- |
| Studio status and learning purpose | `Section` + `VStack` | Always present; full-width and capped by the existing Video Lab content column. |
| Turn length and model pace | `Grid` with `columns={{ minWidth: 280, max: 2 }}` | Two regions when room permits; one full-width region below 560 px. |
| Active turn | `Section` + nested responsive `Grid` | Prompt stays before controls in document order; listen and record panels stack on narrow screens. |
| Practice queue | `VStack as="ol"` with `HStack as="li"` | Remains a one-dimensional list, never a grid of individual cards. |
| Keyboard help | `HStack`, `Text`, and `Kbd` | Wraps rather than clipping. Visible controls always remain available without shortcuts. |

Layout components own gaps and padding: `Section`, `Grid`, `VStack`, and `HStack` use Astryx spacing tokens. Buttons, status dots, headings, text, and keyboard hints use Astryx components. There are no inline style objects, raw layout `<div>` elements, arbitrary spacing utilities, custom colour values, or feature CSS.

## Accessibility contract

- The active practice turn is a semantic `h3` and the current turn count is readable text.
- Every control has a visible label; icons reinforce but do not replace labels.
- Selected duration, pace, and repetition controls expose `aria-pressed`.
- The active queue item exposes `aria-current="step"`.
- Recording count is announced through a polite live region.
- Shortcut handling ignores input, textarea, select, and button targets and modifier combinations, preventing it from hijacking normal form and control interaction.
- Astryx supplies visible focus treatment and honours reduced-motion behavior for its pulsing status control.

## Evidence boundary

The feature applies a short-cycle listen–repeat–review routine. The broader Video Lab evidence map and references remain in [`RESEARCH.md`](RESEARCH.md), including research on captioned video, repetition, and spaced practice. The product does **not** claim that this specific loop improves IELTS band scores, that a recording has been objectively assessed, or that the browser voice is an authoritative pronunciation model.

## Quality and reproducibility

`src/video/shadowing.ts` contains deterministic turn grouping, duration bounds, pace cycling, and index clamping. `src/components/video/ShadowingLab.tsx` contains the interaction layer. The focused coverage command executes the original Video Lab engine/view tests plus the Shadowing Studio engine and interaction tests:

```bash
npm run test:coverage:video
```

It enforces 100% statements, branches, functions, and lines for `src/video/**` and `src/components/video/**`.
