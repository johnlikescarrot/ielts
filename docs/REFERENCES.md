# Learning design references and attribution

IELTS Slayer is a learning aid, not an official IELTS product, score provider,
or replacement for an accredited teacher or examiner. The local feedback in this
extension is heuristic and is deliberately described as an **estimate**.

## Research foundations

1. **Coxhead, A. (2000).** A new academic word list. *TESOL Quarterly, 34*(2),
   213–238. https://doi.org/10.2307/3587951
   - The original Academic Word List research that informs the curated AWL
     lookup data and the contextual vocabulary review in the extension.
2. **Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).**
   Distributed practice in verbal recall tasks: A review and quantitative
   synthesis. *Psychological Science, 17*(11), 1095–1102.
   https://doi.org/10.1111/j.1467-9280.2006.01825.x
   - A research basis for distributing review; the extension's SM-2 scheduling
     is a practical flashcard implementation, not a clinical intervention.
3. **IELTS.** *How IELTS is scored* and public band-descriptor resources.
   https://ielts.org/organisations/ielts-for-organisations/ielts-scoring-in-detail
   - Used as a public reference when presenting band terminology. Official
     marking remains the responsibility of trained IELTS examiners.

## Product research and attribution

The Video Study Studio was informed by a feature review of
[`Libailin222/ielts-video-assistant`](https://github.com/Libailin222/ielts-video-assistant)
on 2026-09-27. That project demonstrates the value of turning YouTube/Bilibili
captions into IELTS practice, including listening timestamps and cross-skill
activities. IELTS Slayer deliberately takes a different architecture:

- learner-supplied captions are processed locally in Firefox;
- no transcript is fetched, uploaded, or sent to an AI API;
- no account, API key, or backend service is required;
- generated material is transparent, deterministic, and retained only in local
  extension storage unless the learner exports a backup.

## Design system attribution

The Video Study Studio uses the
[Meta Astryx design system](https://github.com/facebook/astryx), including its
Neutral theme and accessible React primitives. Astryx is MIT licensed.
