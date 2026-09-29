# Research and product rationale

## Scope

IELTS Slayer is an independent study aid, not an experiment and not an official IELTS assessment. This document records why the Video IELTS Lab uses captioned input, retrieval, immediate feedback, and replay. It also states where the evidence does **not** justify a stronger product claim.

## Reference-project review

The Video Lab was informed by a code and product review of [`Libailin222/ielts-video-assistant`](https://github.com/Libailin222/ielts-video-assistant) at commit `f748738adb825409bddfe090beb2c3b6eff962a2` (reviewed 2026-09-27).

That project is a React/Vite client plus Express server. It obtains YouTube/Bilibili transcripts, sends them to a configurable LLM, and generates reading, listening, speaking, writing, and translation material. Particularly useful interaction ideas include timestamped listening blanks, short auto-paused practice windows, transcript-grounded prompts, and in-context vocabulary.

For a free, login-free Firefox extension, its main product risks are server availability, API-key configuration, remote transcript processing, nondeterministic output, and presenting generated questions with more authority than warranted. IELTS Slayer therefore adopts the learning workflow but not the server architecture:

- transcripts are pasted or opened by the learner and remain local;
- parsing and question generation are deterministic TypeScript;
- source URLs are optional and host-validated;
- academic definitions come from the bundled vocabulary/AWL data;
- automated exercises are explicitly described as study aids;
- Vietnamese is a first-class interface and definition language.

No source code from the reference project was copied.

### Shadowing-player review

Shadowing Studio and local-source replay were additionally informed by a product and code review of [`Hossein-Mosaffa/shadowing-player`](https://github.com/Hossein-Mosaffa/shadowing-player) at commit `0fa7f96903675d896a69a061e94db4dae3780792` (reviewed 2026-09-29). Its MIT-licensed, single-file player combines local audio/video, SRT/VTT captions, bounded chunks, replay, pacing, auto-advance, and keyboard controls.

IELTS Slayer adopts that short, self-paced practice principle in original TypeScript while preserving the extension's privacy model. It adds two complementary paths:

- a guided Shadowing Studio with caption-aligned turns, browser speech, a practice queue, keyboard controls, and an explicitly user-triggered in-memory microphone recorder;
- local SRT/VTT/TXT intake and original-speaker audio/video replay that seeks to a cue, plays at a learner-selected pace, and stops at the next caption boundary.

Safeguards relevant to a Firefox learning extension include:

- subtitle reads capped at 2 MB, with stale asynchronous reads ignored;
- revocable media object URLs and no file upload;
- cue-aligned boundaries rather than a fixed grid that can cut through a caption;
- honest errors for unsupported codecs;
- synthetic speech when no original media is supplied;
- no remote captions, third-party player script, speech-to-text, pronunciation score, login, or telemetry;
- deterministic 100% coverage for the complete bilingual Video Lab and Shadowing Studio.

No source code from this reference project was copied. This is an interaction-design adaptation, not evidence that the software improves IELTS scores.

## Evidence-to-feature map

| Product decision | Evidence and interpretation | Limitation |
| --- | --- | --- |
| Keep captions central to the task | Captioned viewing has shown positive effects for L2 listening/vocabulary relative to uncaptioned viewing (Montero Perez et al., 2013; Kurokawa et al., 2024). | Effects vary by proficiency, caption design, genre, prior vocabulary, and outcome measure. |
| Blank a salient content word | Retrieval makes the learner produce a form instead of merely rereading it. This is an application of retrieval-practice principles, not a claim that one cloze item guarantees retention. | Automatically selected words can be easier or harder than intended. Learners should use level-appropriate sources. |
| Give immediate correctness feedback | Feedback closes the retrieval loop and prevents an incorrect response from becoming the only remembered form. | Exact-match scoring accepts normalized spelling but does not evaluate semantically equivalent answers. |
| Replay a short cue | Repeated audiovisual exposure can aid form recognition; learners control repetition rather than being forced through the entire video. Shadowing Studio makes the loop explicit with selectable turns, local repetitions, pace controls, and record/replay comparison; local media can preserve the original speaker. | Local files depend on browser codec support. Browser speech is a fallback, opening a YouTube source requires network access, and the extension does not evaluate pronunciation or claim a band-score effect. |
| Expose English and Vietnamese definitions | Bilingual support lowers lookup friction for Vietnamese learners while retaining the English definition. | Bundled definitions cover known AWL/bank entries only; this is not a general dictionary. |
| Encourage later review | Spacing has positive aggregate evidence in L2 learning (Kim & Webb, 2022). | The current Video Lab does not yet schedule transcript cues in SM-2; the separate vocabulary deck does use SM-2. |

## References

1. Kurokawa, S., Hein, A. M., & Uchihara, T. (2024). Incidental vocabulary acquisition through captioned viewing: A meta-analysis. *Language Learning*. <https://doi.org/10.1111/lang.12697>
2. Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. *Language Learning, 72*(1), 269–319. <https://doi.org/10.1111/lang.12479>
3. Lo, S. (2024). Vocabulary learning through viewing dual-subtitled videos: Immediate repetition versus spaced repetition as an enhancement strategy. *ReCALL, 36*(2), 152–167. <https://doi.org/10.1017/S0958344024000053>
4. Montero Perez, M., Van Den Noortgate, W., & Desmet, P. (2013). Captioned video for L2 listening and vocabulary learning: A meta-analysis. *System, 41*(3), 720–739. <https://doi.org/10.1016/j.system.2013.07.013>
5. Reynolds, B. L., Cui, Y., Kao, C.-W., & Thomas, N. (2022). Vocabulary acquisition through viewing captioned and subtitled video: A scoping review and meta-analysis. *Systems, 10*(5), 133. <https://doi.org/10.3390/systems10050133>

## Reproducibility

The deterministic engines live in `src/video/videoLesson.ts`, `src/video/shadowing.ts`, and `src/video/localMedia.ts`. Tests cover caption formats and malformed timestamps; markup removal; word selection; vocabulary limits; scoring; URL validation; shadowing-turn grouping; duration and index bounds; pace cycling; subtitle failures and races; media-kind detection; bounded playback; speed clamping; browser playback rejection; decode feedback; and object-URL cleanup. The complete bilingual Video Lab and Shadowing Studio are held to 100% statements, branches, functions, and lines coverage by `npm run test:coverage:video`.
