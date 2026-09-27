# Research and design rationale

This document records what Bandcraft borrowed, changed, and deliberately rejected. It is intended to make product claims auditable and to give educators and researchers a stable description of the intervention.

## 1. Source review: IELTS_SLAYER

Bandcraft's initial product research included a source-level review of [`WeFode/IELTS_SLAYER`](https://github.com/WeFode/IELTS_SLAYER) at commit `d20312a4b23073a8490a83c674f462f018cf5c8a` (2 August 2026).

The upstream project is a local IELTS training system built around original-media clips, subtitle timelines, FSRS vocabulary scheduling, keyboard-first review, and dual-track shadowing. Its web client uses React; its Go service coordinates PostgreSQL, Redis, subtitle parsing, `yt-dlp`, and FFmpeg.

### Adaptation matrix

| Upstream idea            | Evidence in upstream                                                | Bandcraft adaptation                                                                     | Reason for the change                                                                  |
| ------------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Contextual vocabulary    | A selected subtitle word is stored with its sentence and media clip | An explicit page selection is stored with page title, URL, and surrounding selected text | Works on ordinary reading pages without a media pipeline or host permission            |
| FSRS review              | Four-grade review queue backed by `go-fsrs`                         | `ts-fsrs` 5 with deterministic 90% requested retention; `Space`, `1`–`4` workflow        | Keeps a maintained FSRS implementation while remaining fully client-side               |
| Keyboard-first operation | Blind-operable review and shadowing shortcuts                       | Global vocabulary shortcuts plus semantic focusable controls                             | Preserves speed without overriding keys while the learner is typing                    |
| Subtitle-aligned media   | Server imports YouTube/local media and extracts cue clips           | The learner imports local audio and SRT/VTT for the current session                      | Avoids copyright redistribution, platform scraping, a native helper, and server cost   |
| Dual-track shadowing     | Original and learner recordings are alternated and compared         | Native reference/attempt audio controls, A–B cue loop, timing guidance, and self-review  | Keeps the useful perception loop without presenting an unvalidated pronunciation score |
| Local-first philosophy   | Self-hosted services and local media                                | Firefox-managed local storage and in-session Blob URLs                                   | “Install and practise” instead of operating Go, PostgreSQL, Redis, and FFmpeg          |
| No-AI main path          | Learner compares performance directly                               | No AI, remote model, fabricated band score, or token cost anywhere                       | Predictable privacy, latency, reproducibility, and accessibility                       |

Bandcraft does not copy upstream source or visual assets. It adapts learning mechanics to a materially different WebExtension architecture.

## 2. Learning-science basis

### Spacing and retrieval

The vocabulary flow combines active recall with expanding review intervals. This decision is supported by the second-language spacing meta-analysis by Kim and Webb, which synthesized 98 effect sizes from 48 experiments (3,411 learners) and reported benefits for L2 learning and retention [1]. Retrieval practice also tends to improve long-term retention more than repeated study [2].

Bandcraft uses the open-source FSRS algorithm through `ts-fsrs`, with requested retention set to 0.90. FSRS chooses _when_ a card reappears; it does not decide whether a word is useful or whether a learner's definition is correct.

### Shadowing

Shadowing creates a short perception–production–comparison loop: hear a model, imitate it, and compare the result. Foote and McDonough reported improved comprehensibility, accentedness, fluency, and intonation ratings after mobile-assisted shadowing practice [3]. Bandcraft therefore emphasizes replay, A–B looping, local recording, and self-comparison.

Duration guidance is intentionally coarse. “Shorter”, “close”, and “longer” describe timing only. They are not pronunciation, fluency, or IELTS scores.

### Deliberate self-assessment

IELTS Writing and Speaking are each evaluated through four equally weighted criteria. Bandcraft presents those criterion names as a review scaffold and links product documentation to IELTS's public descriptors [4, 5]. It does not reduce the descriptors to a synthetic number, because a word count, timer, or checklist cannot validly reproduce examiner judgment.

## 3. Design hypotheses

Bandcraft is designed around testable hypotheses rather than score promises:

1. **Lower activation energy:** no login and a toolbar capture should reduce the time between encountering useful language and saving it.
2. **Context preservation:** source text and URL should make vocabulary review more meaningful than isolated word lists.
3. **Short feedback loops:** keyboard review and immediate playback should permit more deliberate attempts in a fixed session.
4. **Data agency:** local storage, readable export, and no telemetry should make the tool acceptable for sensitive writing and voice practice.
5. **Criterion visibility:** persistent official assessment lenses should encourage planning and self-review without pretending to automate assessment.

A future evaluation should pre-register outcomes such as delayed vocabulary recall, completed practice sessions, writing revision behavior, and speaking-attempt count. Exam band changes should not be attributed to Bandcraft without an appropriate comparison design.

## 4. Privacy and ethics

- Page content is accessed only after the user invokes the extension action or context menu.
- Microphone access is requested by Firefox at the moment recording begins.
- Audio and imported subtitles are held in component/session memory and are not uploaded.
- Durable study records use `browser.storage.local` and can be exported or reset.
- No analytics are collected, so maintainers cannot infer learning behavior without an explicit, separately consented research build.
- Included prompts are original and are not copied from live or commercial IELTS test materials.

## 5. Known limitations

- Bandcraft does not include full mock Reading or Listening tests and should not replace official familiarization materials.
- Browser timer accuracy can drift when a tab is heavily throttled.
- Timing similarity cannot assess phonemes, stress placement, intelligibility, grammatical quality, or communicative success.
- Self-reported card ratings can be inconsistent.
- Local Firefox data can be lost if the profile or extension is removed before export.
- Vietnamese localization covers the product interface and original prompts, not third-party page content.
- No software can guarantee an IELTS band score.

## 6. Reproducibility

The repository pins application and CI dependencies, includes original prompt data, and enforces 100% branch/line/function/statement coverage. Run:

```bash
npm ci
npm run validate
npm run package
```

The production manifest explicitly declares no data collection. The package can be inspected with any ZIP tool.

## References

1. Kim, S. K., & Webb, S. (2022). The effects of spaced practice on second language learning: A meta-analysis. _Language Learning, 72_(1), 269–319. <https://doi.org/10.1111/lang.12479>
2. Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. _Psychological Science, 17_(3), 249–255. <https://doi.org/10.1111/j.1467-9280.2006.01693.x>
3. Foote, J. A., & McDonough, K. (2017). Using shadowing with mobile technology to improve L2 pronunciation. _Journal of Second Language Pronunciation, 3_(1), 34–56. <https://doi.org/10.1075/jslp.3.1.02foo>
4. IELTS. (2023). _Writing Band Descriptors_. <https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf>
5. IELTS. (n.d.). _Speaking Band Descriptors_. <https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf>
6. Open Spaced Repetition. _Free Spaced Repetition Scheduler_. <https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm>
7. WeFode. _IELTS_SLAYER_. <https://github.com/WeFode/IELTS_SLAYER>
8. Meta. _Astryx design system_. <https://github.com/facebook/astryx>
