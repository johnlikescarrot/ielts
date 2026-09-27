# Learning design and research notes

IELTS Forge translates well-established learning principles into small interactions. This document distinguishes the evidence from product choices and avoids implying that a study technique, extension, or heuristic can guarantee an IELTS result.

## Design mapping

| Evidence-informed principle | Product implementation                                                                        | Important limitation                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Retrieval practice          | Listening transcription, reading questions, cloze-like cards, and answer reveal before rating | Recall helps learning; it does not make every prompt exam-valid                  |
| Distributed practice        | Due dates and increasing review intervals                                                     | The scheduler is an SM-2-derived heuristic, not a clinical or psychometric model |
| Corrective feedback         | Immediate transcript overlap and reading answer feedback                                      | Word overlap does not measure listening band score                               |
| Interleaving                | A short circuit across listening, reading, writing, and speaking                              | Mixed practice can feel harder and should complement full-length mock tests      |
| Deliberate comparison       | Listen → record → replay → self-rate for speaking                                             | Self-rating is not a substitute for trained human assessment                     |
| Authentic context           | Learners capture useful language from pages they chose to read                                | Source quality and copyright compliance remain the learner's responsibility      |

## Scholarly foundations

1. **Roediger, H. L., & Karpicke, J. D. (2006).** Test-enhanced learning: Taking memory tests improves long-term retention. _Psychological Science, 17_(3), 249–255. <https://doi.org/10.1111/j.1467-9280.2006.01693.x>
   - Supports requiring active recall before showing an answer rather than defaulting to rereading.

2. **Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006).** Distributed practice in verbal recall tasks: A review and quantitative synthesis. _Psychological Bulletin, 132_(3), 354–380. <https://doi.org/10.1037/0033-2909.132.3.354>
   - Supports distributing review over time rather than massing every review in one sitting.

3. **Kornell, N., & Bjork, R. A. (2008).** Learning concepts and categories: Is spacing the “enemy of induction”? _Psychological Science, 19_(6), 585–592. <https://doi.org/10.1111/j.1467-9280.2008.02127.x>
   - Provides evidence that interleaved presentation can improve category learning even when learners perceive blocked study as easier.

4. **Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013).** Improving students’ learning with effective learning techniques. _Psychological Science in the Public Interest, 14_(1), 4–58. <https://doi.org/10.1177/1529100612453266>
   - Reviews common study techniques and rates practice testing and distributed practice highly across learning conditions.

5. **Kang, S. H. K. (2016).** Spaced repetition promotes efficient and effective learning. _Policy Insights from the Behavioral and Brain Sciences, 3_(1), 12–19. <https://doi.org/10.1177/2372732215624708>
   - Summarizes practical benefits and boundary conditions of spaced review.

6. **Ericsson, K. A., Krampe, R. T., & Tesch-Römer, C. (1993).** The role of deliberate practice in the acquisition of expert performance. _Psychological Review, 100_(3), 363–406. <https://doi.org/10.1037/0033-295X.100.3.363>
   - Motivates short, goal-directed drills with comparison and repeated attempts. Later research debates how much variance deliberate practice explains, so Forge does not describe it as sufficient by itself.

7. **Hattie, J., & Timperley, H. (2007).** The power of feedback. _Review of Educational Research, 77_(1), 81–112. <https://doi.org/10.3102/003465430298487>
   - Supports feedback that makes the gap between current and desired performance actionable.

## IELTS alignment

Forge practices component skills but does not calculate an IELTS band. Learners should use the official public criteria to understand what trained examiners assess:

- [IELTS speaking band descriptors](https://ielts.org/organisations/ielts-for-organisations/ielts-scoring-in-detail)
- [IELTS writing assessment criteria](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
- [IELTS preparation resources](https://ielts.org/take-a-test/preparation-resources)

The four practice modes are intentionally narrow:

- **Listening:** transcription gives immediate lexical feedback, but does not assess all listening question types.
- **Reading:** main-claim identification exercises global comprehension, but not test timing or the complete item taxonomy.
- **Writing:** short position practice lowers the activation cost of drafting, but does not grade task response, coherence, vocabulary, or grammar.
- **Speaking:** original/self replay can reveal timing, hesitation, and stress differences, but it cannot produce a valid fluency, pronunciation, lexical, or grammatical band.

## Source-project review

[WeFode/IELTS_SLAYER](https://github.com/WeFode/IELTS_SLAYER) informed the product direction. The review covered its README, planning and design documents, React pages, Go API boundaries, FSRS review flow, subtitle/media pipeline, and local shadowing analysis.

Ideas retained:

- authentic context instead of isolated word lists;
- rapid keyboard-oriented review;
- distributed review of weak items;
- original-versus-self shadowing;
- local-first data and transparent, non-AI assistance.

Ideas changed for the Firefox setting:

- page selection replaces the `yt-dlp`/FFmpeg subtitle pipeline;
- Firefox local storage replaces PostgreSQL and Redis;
- Web Speech and MediaRecorder replace server-generated cue clips;
- JSON backup replaces accounts and synchronization;
- English/Vietnamese replaces the original English/Chinese interface target.

These are adaptations, not copied source. IELTS Forge has an independent TypeScript implementation and visual system.
