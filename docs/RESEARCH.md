# Research and product rationale

## Scope

IELTS Slayer is an independent study aid, not an experiment and not an official IELTS assessment. This document records why the Video IELTS Lab uses captioned input, retrieval, immediate feedback, and replay, and why the Shadowing Studio uses chunked speak-along practice with self-rated spaced review. It also states where the evidence does **not** justify a stronger product claim.

## Reference-project reviews

### Video Lab — `Libailin222/ielts-video-assistant`

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

### Shadowing Studio — `Hossein-Mosaffa/shadowing-player`

The Shadowing Studio was informed by a product review of [`Hossein-Mosaffa/shadowing-player`](https://github.com/Hossein-Mosaffa/shadowing-player) at commit `0fa7f96903675d896a69a061e94db4dae3780792` (reviewed 2026-09-29).

That project is a single-file HTML/JavaScript shadowing player: it plays media in 3–120 s chunks with a replay button, 0.5×–2× speed control, auto-advance, a progress bar, YouTube sources, local files, SRT/VTT subtitles, a light/dark theme, and keyboard shortcuts (Space to replay, ← / → for the previous/next chunk, R to cycle speed). Its strengths are focus and immediacy: everything runs in one page with no account and no server.

For a bilingual IELTS extension, the opportunities were to keep that keyboard-first practice loop while adding what a standalone page cannot offer: spaced review of the practised material, resumable sessions, bilingual UI, and integration with an existing transcript workflow. IELTS Slayer therefore rebuilds the interaction natively:

- chunking reuses the deterministic caption parser already tested for the Video Lab (3–120 s targets, at least one cue per chunk);
- playback uses the browser's speech synthesis at 0.5×–2×, with an optional jump to the original YouTube timestamp;
- the same shortcuts are preserved (Space, ← / →, R) and are disabled while typing in form controls;
- each chunk is rated by the learner and scheduled with the same local SM-2 algorithm as the vocabulary deck;
- sessions persist locally (capped, resumable, exportable in the JSON backup) and are structurally validated before being restored;
- the transcript can be hidden so the learner shadows from memory rather than reading along.

No source code from the reference project was copied; the engine is an original TypeScript implementation covered by deterministic unit tests.

## Evidence-to-feature map

### Video Lab

| Product decision | Evidence and interpretation | Limitation |
| --- | --- | --- |
| Keep captions central to the task | Captioned viewing has shown positive effects for L2 listening/vocabulary relative to uncaptioned viewing (Montero Perez et al., 2013; Kurokawa et al., 2024). | Effects vary by proficiency, caption design, genre, prior vocabulary, and outcome measure. |
| Blank a salient content word | Retrieval makes the learner produce a form instead of merely rereading it. This is an application of retrieval-practice principles, not a claim that one cloze item guarantees retention. | Automatically selected words can be easier or harder than intended. Learners should use level-appropriate sources. |
| Give immediate correctness feedback | Feedback closes the retrieval loop and prevents an incorrect response from becoming the only remembered form. | Exact-match scoring accepts normalized spelling but does not evaluate semantically equivalent answers. |
| Replay a short cue | Repeated audiovisual exposure can aid form recognition; learners control repetition rather than being forced through the entire video. | Browser speech synthesis is a fallback cue, not the original speaker audio. Opening the source requires network access. |
| Expose English and Vietnamese definitions | Bilingual support lowers lookup friction for Vietnamese learners while retaining the English definition. | Bundled definitions cover known AWL/bank entries only; this is not a general dictionary. |
| Encourage later review | Spacing has positive aggregate evidence in L2 learning (Kim & Webb, 2022). | The listening cloze itself still schedules nothing; the Shadowing Studio and the vocabulary deck both schedule with SM-2. |

### Shadowing Studio

| Product decision | Evidence and interpretation | Limitation |
| --- | --- | --- |
| Practise in short chunks (3–120 s) with immediate replay | Shadowing — repeating what one hears as simultaneously and accurately as possible — is an established EFL technique with reported benefits for lower-proficiency listeners in particular (Hamada, 2012, 2016). Short chunks keep the memory load manageable and let the learner repeat instantly. | Reported gains vary by proficiency level and task; shadowing is a practice technique, not an IELTS-specific score predictor. |
| Let the learner control playback speed (0.5×–2×) | Slower playback can support form-focused repetition while the learner builds accuracy; the learner, not the software, picks the speed. | Browser speech synthesis is not the original speaker; opening the source video preserves the authentic model when a URL is supplied. |
| Hide the transcript to force shadowing from memory | Reading along turns the task into read-aloud; hiding the text restores the listen-and-repeat loop the technique is named after. | Some learners need the transcript for accessibility or confidence; it stays one click away. |
| Rate each attempt and schedule chunks with SM-2 | Spacing has positive aggregate evidence in L2 learning (Kim & Webb, 2022); self-rated difficulty is a pragmatic way to schedule the material each learner finds hard. | Self-ratings are subjective estimates of felt difficulty, not measures of pronunciation or accuracy, and are never presented as IELTS scores. |
| Persist sessions locally and offer resume | Interrupted practice is common; resumable chunks keep the loop alive across days, and the due-chunk ordering re-prioritises what is scheduled. | Only the last ten sessions are kept; anything older is discarded to bound storage. |

## References

1. Hamada, Y. (2012). An effective way to improve listening skills through shadowing. *The Language Teacher, 36*(1), 3–10. <https://doi.org/10.37546/JALTTLT36.1-1>
2. Hamada, Y. (2016). Shadowing: Who benefits and how? Uncovering a booming EFL teaching technique for listening comprehension. *Language Teaching Research, 20*(1), 35–52. <https://doi.org/10.1177/1362168815597504>
3. Kurokawa, S., Hein, A. M., & Uchihara, T. (2024). Incidental vocabulary acquisition through captioned viewing: A meta-analysis. *Language Learning*. <https://doi.org/10.1111/lang.12697>
4. Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning, 72*(1), 269–319. <https://doi.org/10.1111/lang.12479>
5. Lo, S. (2024). Vocabulary learning through viewing dual-subtitled videos: Immediate repetition versus spaced repetition as an enhancement strategy. *ReCALL, 36*(2), 152–167. <https://doi.org/10.1017/S0958344024000053>
6. Montero Perez, M., Van Den Noortgate, W., & Desmet, P. (2013). Captioned video for L2 listening and vocabulary learning: A meta-analysis. *System, 41*(3), 720–739. <https://doi.org/10.1016/j.system.2013.07.013>
7. Reynolds, B. L., Cui, Y., Kao, C.-W., & Thomas, N. (2022). Vocabulary acquisition through viewing captioned and subtitled video: A scoping review and meta-analysis. *Systems, 10*(5), 133. <https://doi.org/10.3390/systems10050133>

## Reproducibility

The lesson engine lives in `src/video/videoLesson.ts`. Its behavior is covered by deterministic unit tests for SRT, YouTube-style, timestamped, and plain-text input; malformed timestamps; markup removal; word selection; vocabulary limits; scoring; timestamp formatting; and YouTube URL validation. The complete Video Lab, including its React workflow, is held to 100% statements, branches, functions, and lines coverage by `npm run test:coverage:video`.

The shadowing engine lives in `src/shadowing/shadowingEngine.ts`. Its behavior is covered by deterministic unit tests for chunk grouping across the 3–120 s range, session creation, all four self-ratings through the SM-2 scheduler, due and mastery state, cyclic due-chunk ordering, speed cycling, keyboard-shortcut mapping (including modifiers and form controls), transcript fingerprinting, and structural validation of restored sessions. The complete Shadowing Studio, including its React workflow, is held to 100% statements, branches, functions, and lines coverage by `npm run test:coverage:shadowing`. Session persistence (resume ordering, upsert, ten-record cap, deletion, backup round-trip) is covered by the storage suite.
