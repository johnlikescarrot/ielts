# Research and product rationale

## Scope

IELTS Slayer is an independent study aid, not an experiment and not an official IELTS assessment. This document records why the Video IELTS Lab uses captioned input, retrieval, immediate feedback, and replay, and why the Shadowing Studio uses listen–repeat chunking. It also states where the evidence does **not** justify a stronger product claim.

## Reference-project reviews

### `Hossein-Mosaffa/shadowing-player` (Shadow Player)

The Shadowing Studio was informed by a code and product review of [`Hossein-Mosaffa/shadowing-player`](https://github.com/Hossein-Mosaffa/shadowing-player) at commit `0fa7f96903675d896a69a061e94db4dae3780792` (reviewed 2026-09-28).

Shadow Player is a single-file HTML player for language shadowing: it splits a video into fixed time chunks (3–120 seconds, default 10), offers one-click chunk replay, cycles playback speed (0.5×–2×), optionally auto-advances, loads local media via object URLs, parses SRT subtitles in-browser, and drives everything from four keyboard shortcuts. Its core loop — listen, repeat aloud, replay, refine, advance — is exactly the technique the research literature calls shadowing.

For a free, login-free Firefox extension, the main product risks of the reference design are: YouTube control requires the IFrame Player API, which is remotely hosted code that Firefox add-on policy forbids and which conflicts with this extension's no-third-party-script promise; chunk boundaries are a fixed time grid that can cut a sentence mid-speech; nothing is tracked, so learners cannot see which chunks need more work; and there is no fallback when the learner has no media file. IELTS Slayer therefore adopts the loop and shortcuts, but not those limitations:

- chunks snap to caption cue boundaries, so a cue is never split across chunks;
- three replay engines: on-device speech synthesis (zero setup), a `youtube-nocookie` embed re-opened per chunk with `start`/`end` URL parameters (no remote scripts), and local files with boundary auto-stop;
- per-chunk replay and completion tracking, a session review, and local-history persistence;
- bilingual EN/VI interface and sample captions for immediate onboarding.

No source code from the reference project was copied.

### `Libailin222/ielts-video-assistant`

The Video Lab was informed by a code and product review of [`Libailin222/ielts-video-assistant`](https://github.com/Libailin222/ielts-video-assistant) at commit `f748738adb825409bddfe090beb2c3b6eff962a2` (reviewed 2026-09-27).

That project is a React/Vite client plus Express server. It obtains YouTube/Bilibili transcripts, sends them to a configurable LLM, and generates reading, listening, speaking, writing, and translation material. Particularly useful interaction ideas include timestamped listening blanks, short auto-paused practice windows, transcript-grounded prompts, and in-context vocabulary.

For a free, login-free Firefox extension, its main product risks are server availability, API-key configuration, remote transcript processing, nondeterministic output, and presenting generated questions with more authority than warranted. IELTS Slayer therefore adopts the learning workflow but not the server architecture:

- transcripts are pasted by the learner and remain local;
- parsing and question generation are deterministic TypeScript;
- source URLs are optional and host-validated;
- academic definitions come from the bundled vocabulary/AWL data;
- automated exercises are explicitly described as study aids;
- Vietnamese is a first-class interface and definition language.

No source code from the reference project was copied.

## Evidence-to-feature map

| Product decision | Evidence and interpretation | Limitation |
| --- | --- | --- |
| Keep captions central to the task | Captioned viewing has shown positive effects for L2 listening/vocabulary relative to uncaptioned viewing (Montero Perez et al., 2013; Kurokawa et al., 2024). | Effects vary by proficiency, caption design, genre, prior vocabulary, and outcome measure. |
| Blank a salient content word | Retrieval makes the learner produce a form instead of merely rereading it. This is an application of retrieval-practice principles, not a claim that one cloze item guarantees retention. | Automatically selected words can be easier or harder than intended. Learners should use level-appropriate sources. |
| Give immediate correctness feedback | Feedback closes the retrieval loop and prevents an incorrect response from becoming the only remembered form. | Exact-match scoring accepts normalized spelling but does not evaluate semantically equivalent answers. |
| Replay a short cue | Repeated audiovisual exposure can aid form recognition; learners control repetition rather than being forced through the entire video. | Browser speech synthesis is a fallback cue, not the original speaker audio. Opening the source requires network access. |
| Expose English and Vietnamese definitions | Bilingual support lowers lookup friction for Vietnamese learners while retaining the English definition. | Bundled definitions cover known AWL/bank entries only; this is not a general dictionary. |
| Encourage later review | Spacing has positive aggregate evidence in L2 learning (Kim & Webb, 2022). | The current Video Lab does not yet schedule transcript cues in SM-2; the separate vocabulary deck does use SM-2. |

## Shadowing Studio evidence-to-feature map

| Product decision | Evidence and interpretation | Limitation |
| --- | --- | --- |
| Chunked listen–repeat practice | Shadowing is associated with L2 listening-comprehension gains across proficiency levels, with the largest benefits for lower-proficiency learners (Hamada, 2016). | Evidence comes from classroom and controlled studies, not from this extension. IELTS Slayer does not measure learning outcomes. |
| Short chunks the learner controls | Hamada (2016) reports benefits from brief, regular sessions (10–15 minutes, several times per week), which motivates 3–120-second chunks and session review rather than marathon drills. | Session-length guidance is a study aid, not a prescription. |
| Replay and refine at variable speed | Self-directed shadowing with freely chosen media improved spontaneous pronunciation comprehensibility in ESL learners (Foote & McDonough, 2017), supporting learner-controlled replay and 0.5×–2× speed cycling. | Pronunciation outcomes were rated on specific tasks; the extension provides no automated pronunciation scoring. |
| Hide the script while shadowing | Foote & McDonough (2017) describe full shadowing (audio-only) and script-assisted shadowing as complementary stages; script hiding plus per-chunk peeking supports both. | The extension cannot detect which mode a learner used. |
| Track replays per chunk | Self-regulated practice benefits from visible progress indicators; per-chunk replay counts make extra effort visible and actionable in the session review. | Replay counts are activity metrics, not proficiency estimates, and no band score is claimed for shadowing sessions. |
| Play YouTube chunks without remote code | Chunk windows are re-opened in a `youtube-nocookie` embed with `start`/`end` parameters, honouring Firefox add-on policy and the extension's no-third-party-script promise. | The embedded player cannot signal chunk completion, so auto-advance is unavailable in this mode and is clearly labelled as such. |

## References

1. Foote, J. A., & McDonough, K. (2017). Using shadowing with mobile technology to improve L2 pronunciation. *Journal of Second Language Pronunciation, 3*(1), 33–56. <https://doi.org/10.1075/jslp.3.1.03foo>
2. Hamada, Y. (2016). Shadowing: Who benefits and how? Uncovering a booming EFL teaching technique for listening comprehension. *Language Teaching Research, 20*(1), 35–52. <https://doi.org/10.1177/1362168814559774>
3. Kurokawa, S., Hein, A. M., & Uchihara, T. (2024). Incidental vocabulary acquisition through captioned viewing: A meta-analysis. *Language Learning*. <https://doi.org/10.1111/lang.12697>
4. Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning, 72*(1), 269–319. <https://doi.org/10.1111/lang.12479>
5. Lo, S. (2024). Vocabulary learning through viewing dual-subtitled videos: Immediate repetition versus spaced repetition as an enhancement strategy. *ReCALL, 36*(2), 152–167. <https://doi.org/10.1017/S0958344024000053>
6. Montero Perez, M., Van Den Noortgate, W., & Desmet, P. (2013). Captioned video for L2 listening and vocabulary learning: A meta-analysis. *System, 41*(3), 720–739. <https://doi.org/10.1016/j.system.2013.07.013>
7. Reynolds, B. L., Cui, Y., Kao, C.-W., & Thomas, N. (2022). Vocabulary acquisition through viewing captioned and subtitled video: A scoping review and meta-analysis. *Systems, 10*(5), 133. <https://doi.org/10.3390/systems10050133>

## Reproducibility

The lesson engine lives in `src/video/videoLesson.ts`. Its behavior is covered by deterministic unit tests for SRT, YouTube-style, timestamped, and plain-text input; malformed timestamps; markup removal; word selection; vocabulary limits; scoring; timestamp formatting; and YouTube URL validation. The complete Video Lab, including its React workflow, is held to 100% statements, branches, functions, and lines coverage by `npm run test:coverage:video`.

The shadowing engines live in `src/shadowing/` (cue-aligned chunker, session tracking, local-media and speech replay engines, privacy-preserving YouTube embed URLs) with `src/components/shadowing/ShadowingStudioView.tsx` as the workflow UI. Their behavior is covered by deterministic unit tests for chunk alignment, clamping, speed cycling, session accounting, media boundary auto-stop, natural-end completion, speech error and cancellation paths, and embed URL construction, plus end-to-end component tests for all three replay engines, keyboard shortcuts, script hiding, chunk-length tuning, review and revisit flows, and Vietnamese localization. The complete Shadowing Studio is held to 100% statements, branches, functions, and lines coverage by `npm run test:coverage:shadowing`.
