# Research and product rationale

## Scope

IELTS Slayer is an independent study aid, not an experiment and not an official IELTS assessment. This document records why the Video IELTS Lab uses captioned input, retrieval, immediate feedback, and replay. It also states where the evidence does **not** justify a stronger product claim.

## Reference-project review

The Shadowing Studio was informed by a product review of [`Hossein-Mosaffa/shadowing-player`](https://github.com/Hossein-Mosaffa/shadowing-player) (reviewed 2026-09-29). It is an MIT-licensed, single-file language-shadowing player built around short chunks of natural speech. Its useful interaction model is clear: choose a chunk length, replay the current chunk, adjust speed, optionally auto-advance, and keep hands on the keyboard with Space, Left/Right, and R shortcuts. It also supports user-selected local media/subtitles and YouTube links.

IELTS Slayer adopts that learner-controlled rehearsal loop without taking control of media playback or uploading captions. It deterministically buckets a pasted transcript into 5-, 10-, or 15-second chunks, reads the active chunk through the browser's local speech synthesis, supports replay/speed/auto-advance/keyboard control, and offers an optional timestamp handoff to a learner-supplied YouTube URL. Browser speech is explicitly a practice cue, not a substitute for the source speaker. No source code from the project was copied.

The Video Lab was also informed by a code and product review of [`Libailin222/ielts-video-assistant`](https://github.com/Libailin222/ielts-video-assistant) at commit `f748738adb825409bddfe090beb2c3b6eff962a2` (reviewed 2026-09-27).

That project is a React/Vite client plus Express server. It obtains YouTube/Bilibili transcripts, sends them to a configurable LLM, and generates reading, listening, speaking, writing, and translation material. Particularly useful interaction ideas include timestamped listening blanks, short auto-paused practice windows, transcript-grounded prompts, and in-context vocabulary.

For a free, login-free Firefox extension, the main product risks are server availability, API-key configuration, remote transcript processing, nondeterministic output, and presenting generated questions with more authority than warranted. IELTS Slayer therefore adopts the learning workflow but not the server architecture:

- transcripts are pasted by the learner and remain local;
- parsing, chunking, and question generation are deterministic TypeScript;
- source URLs are optional and host-validated;
- academic definitions come from the bundled vocabulary/AWL data;
- automated exercises are explicitly described as study aids;
- Vietnamese is a first-class interface and definition language.

## Evidence-to-feature map

| Product decision | Evidence and interpretation | Limitation |
| --- | --- | --- |
| Keep captions central to the task | Captioned viewing has shown positive effects for L2 listening/vocabulary relative to uncaptioned viewing (Montero Perez et al., 2013; Kurokawa et al., 2024). | Effects vary by proficiency, caption design, genre, prior vocabulary, and outcome measure. |
| Blank a salient content word | Retrieval makes the learner produce a form instead of merely rereading it. This is an application of retrieval-practice principles, not a claim that one cloze item guarantees retention. | Automatically selected words can be easier or harder than intended. Learners should use level-appropriate sources. |
| Give immediate correctness feedback | Feedback closes the retrieval loop and prevents an incorrect response from becoming the only remembered form. | Exact-match scoring accepts normalized spelling but does not evaluate semantically equivalent answers. |
| Replay a short shadowing chunk | The learner-controlled loop applies repeated, focused exposure before advancing; the interface deliberately keeps chunk size, replay, speed, and auto-advance visible. | Browser speech synthesis is a browser-provided practice cue, not the original speaker audio. Opening the learner-provided source requires network access. |
| Expose English and Vietnamese definitions | Bilingual support lowers lookup friction for Vietnamese learners while retaining the English definition. | Bundled definitions cover known AWL/bank entries only; this is not a general dictionary. |
| Encourage later review | Spacing has positive aggregate evidence in L2 learning (Kim & Webb, 2022). | The current Video Lab does not yet schedule transcript cues in SM-2; the separate vocabulary deck does use SM-2. |

## References

1. Kurokawa, S., Hein, A. M., & Uchihara, T. (2024). Incidental vocabulary acquisition through captioned viewing: A meta-analysis. *Language Learning*. <https://doi.org/10.1111/lang.12697>
2. Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning, 72*(1), 269–319. <https://doi.org/10.1111/lang.12479>
3. Lo, S. (2024). Vocabulary learning through viewing dual-subtitled videos: Immediate repetition versus spaced repetition as an enhancement strategy. *ReCALL, 36*(2), 152–167. <https://doi.org/10.1017/S0958344024000053>
4. Montero Perez, M., Van Den Noortgate, W., & Desmet, P. (2013). Captioned video for L2 listening and vocabulary learning: A meta-analysis. *System, 41*(3), 720–739. <https://doi.org/10.1016/j.system.2013.07.013>
5. Reynolds, B. L., Cui, Y., Kao, C.-W., & Thomas, N. (2022). Vocabulary acquisition through viewing captioned and subtitled video: A scoping review and meta-analysis. *Systems, 10*(5), 133. <https://doi.org/10.3390/systems10050133>

## Reproducibility

The caption lesson engine lives in `src/video/videoLesson.ts`, and the deterministic chunking/session engine lives in `src/video/shadowingSession.ts`. Their behavior is covered by unit tests for SRT, YouTube-style, timestamped, and plain-text input; malformed timestamps; markup removal; word selection; vocabulary limits; scoring; timestamp formatting; URL validation; chunk bounds; navigation; progress; and speed cycling. The complete Video Lab, including the React shadowing controls and learning workflow, is held to 100% statements, branches, functions, and lines coverage by `npm run test:coverage:video`.
