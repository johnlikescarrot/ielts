# Research rationale

IELTS Forge combines four practice mechanisms: contextual encounters, effortful retrieval, spaced scheduling, and listen-record-compare shadowing. This document maps each product decision to research without claiming that the extension itself has been experimentally validated or that use guarantees an IELTS score.

Every reference includes a Google Scholar lookup so readers can inspect versions, citations, and later work.

## 1. Retrieval practice

The review screen asks the learner to reconstruct missing language before revealing it. This is intentional: merely rereading a phrase can create familiarity without reliable recall.

- Roediger and Karpicke found that testing improved delayed retention compared with repeated study, although study could look better on an immediate test.[^1]
- Karpicke and Roediger's foreign-language vocabulary experiments emphasized continued retrieval after an item is first recalled.[^2]
- Rowland's meta-analysis reported a robust testing effect across many experimental conditions.[^3]
- Adesope, Trevisan, and Sundararajan's meta-analysis likewise found practice testing beneficial across classroom-relevant settings.[^4]
- Dunlosky et al. rated practice testing and distributed practice among the highest-utility learning techniques they reviewed.[^5]

**Implementation:** the target is replaced with a blank when it appears in context. `Space` reveals it; no rating is accepted by the visible workflow until retrieval has been attempted.

## 2. Spacing and FSRS

Spacing effects are old and reliable at the general level, but the best interval depends on the desired retention period, material, learner, and criterion.

- Ebbinghaus's foundational experiments described forgetting and savings across repeated learning.[^6]
- Cepeda et al.'s quantitative synthesis found distributed practice effects across verbal-memory studies and substantial variation in optimal spacing.[^7]
- Cepeda et al. later showed that the gap that works best changes with the test delay.[^8]
- Kang reviewed spaced repetition and discussed implications for efficient learning.[^9]
- Nakata compared expanding and equal spacing specifically for second-language vocabulary.[^10]
- Wozniak and Gorzelańczyk described early computational optimization of repetition spacing.[^11]
- Ye et al. framed spaced-repetition scheduling as an optimization problem underlying modern FSRS work.[^12]

**Implementation:** [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) stores difficulty, stability, state, lapses, repetitions, and due time. The scheduler requests 90% retention and disables fuzz so tests and backups are reproducible. A user rating is evidence supplied to the scheduler—not a claim that the algorithm knows the learner perfectly.

## 3. Vocabulary in context

A word is more useful when linked to a sentence, meaning, source, and productive use. Repetition matters, but repeated encounters differ in quality and do not guarantee mastery.

- Nation's synthesis treats vocabulary knowledge as multidimensional and combines deliberate learning with meaning-focused input and output.[^13]
- Webb found that repeated encounters can develop several aspects of word knowledge, with gains differing by knowledge type.[^14]
- Uchihara, Webb, and Yanagisawa meta-analyzed repetition and incidental vocabulary learning.[^15]
- Laufer and Hulstijn proposed “involvement load” to explain why tasks requiring need, search, and evaluation can produce different vocabulary outcomes.[^16]
- Nakata reviewed word cards and computer-assisted vocabulary practice through findings from cognitive psychology.[^17]
- Webb, Yanagisawa, and Uchihara meta-analyzed intentional vocabulary-learning activities.[^18]

**Implementation:** capture stores the selected language, a sentence, a note, an IELTS-skill label, and optional page metadata together. Deduplication includes context and source, allowing one expression to be learned from genuinely different uses.

## 4. Productive practice and feedback

IELTS Speaking and Writing require production, not only recognition. Output can make gaps noticeable, but useful feedback does not have to be an opaque automatic score.

- Swain's output hypothesis argued that producing language can push learners to process form and notice what they cannot yet express.[^19]
- Saito's meta-analysis found that explicit pronunciation instruction can affect instructed second-language pronunciation, while outcomes depend on target and measurement.[^20]
- Martin showed that structured, homework-based pronunciation training can support development outside a traditional classroom.[^21]
- Martin and Sippel compared peer and teacher feedback for L2 pronunciation, illustrating the value—and complexity—of human judgment.[^22]

**Implementation:** IELTS Forge never labels a recording “correct,” computes no pseudo-precise pronunciation score, and sends no audio to AI. It makes rapid self-comparison easy and leaves the judgment with the learner or teacher.

## 5. Shadowing and multimodal comparison

Shadowing asks a learner to repeat speech closely after a model, attending to timing, stress, phrasing, and articulation. Research is promising but heterogeneous: shadowing procedures, proficiency levels, outcome measures, and comparison groups vary.

- Hamada synthesizes second-language shadowing theory, research, and classroom procedure.[^23]
- Kadota connects shadowing practice to speech perception and production mechanisms in second-language acquisition.[^24]
- Foote and McDonough investigated shadowing as pronunciation practice with mobile support.[^25]
- Baddeley's account of working memory gives a broader theoretical basis for short-lived phonological maintenance and rehearsal.[^26]
- Paivio's dual-coding account motivates combining verbal information with another representation, while not implying that any added visualization automatically helps.[^27]
- Mayer's multimedia-learning work cautions that multiple representations should be coherent and should avoid unnecessary cognitive load.[^28]

**Implementation:** the shadowing studio presents one phrase, one model control, one recording control, and immediate playback. It does not add decorative scoring or waveform claims. The model currently comes from Firefox speech synthesis, whose naturalness depends on locally available voices.

## 6. Desirable difficulty and honest UX

Learning can feel harder when it is working better. The interface therefore avoids treating ease, streak length, or time spent as proof of competence.

- Bjork and Bjork distinguish current performance from durable learning and describe conditions that can create “desirable difficulties.”[^29]
- Soderstrom and Bjork review the important distinction between learning and performance.[^30]

**Implementation:** progress reports completed retrievals, not an IELTS band estimate. Streaks support routine but do not alter scheduling. The project states that evidence informs the workflow; it does not validate this particular product.

## Design-to-evidence map

| Feature                         | Primary rationale                                 | Important limitation                                                       |
| ------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| Cloze-first review              | Retrieval-practice literature                     | One card format does not suit every knowledge type.                        |
| FSRS queue                      | Distributed practice and computational scheduling | Parameters are population-derived defaults, not fitted to this individual. |
| Sentence + source capture       | Contextual and involvement accounts               | A saved context can still be misunderstood.                                |
| Four response ratings           | Memory-state update for scheduling                | Self-rating is noisy and subjective.                                       |
| Model/self alternating playback | Output, pronunciation practice, shadowing         | Self-listening is not expert corrective feedback.                          |
| Daily target and streak         | Supports consistent opportunity to practise       | Activity is not achievement.                                               |
| No AI score                     | Avoids unvalidated precision and data transfer    | The learner must seek human feedback for persistent problems.              |

## References

[^1]: Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. _Psychological Science, 17_(3), 249–255. [Google Scholar](https://scholar.google.com/scholar?q=Test-enhanced+learning+Taking+memory+tests+improves+long-term+retention)

[^2]: Karpicke, J. D., & Roediger, H. L. (2008). The critical importance of retrieval for learning. _Science, 319_(5865), 966–968. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1126/science.1152408)

[^3]: Rowland, C. A. (2014). The effect of testing versus restudy on retention: A meta-analytic review of the testing effect. _Psychological Bulletin, 140_(6), 1432–1463. [Google Scholar](https://scholar.google.com/scholar?q=Rowland+2014+effect+testing+versus+restudy+meta-analytic)

[^4]: Adesope, O. O., Trevisan, D. A., & Sundararajan, N. (2017). Rethinking the use of tests: A meta-analysis of practice testing. _Review of Educational Research, 87_(3), 659–701. [Google Scholar](https://scholar.google.com/scholar?q=Rethinking+the+use+of+tests+meta-analysis+practice+testing)

[^5]: Dunlosky, J., Rawson, K. A., Marsh, E. J., Nathan, M. J., & Willingham, D. T. (2013). Improving students' learning with effective learning techniques. _Psychological Science in the Public Interest, 14_(1), 4–58. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177/1529100612453266)

[^6]: Ebbinghaus, H. (1885/1913). _Memory: A Contribution to Experimental Psychology_. [Google Scholar](https://scholar.google.com/scholar?q=Ebbinghaus+Memory+A+Contribution+to+Experimental+Psychology)

[^7]: Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis. _Psychological Bulletin, 132_(3), 354–380. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1037/0033-2909.132.3.354)

[^8]: Cepeda, N. J., Vul, E., Rohrer, D., Wixted, J. T., & Pashler, H. (2008). Spacing effects in learning: A temporal ridgeline of optimal retention. _Psychological Science, 19_(11), 1095–1102. [Google Scholar](https://scholar.google.com/scholar?q=Spacing+effects+in+learning+temporal+ridgeline+optimal+retention)

[^9]: Kang, S. H. K. (2016). Spaced repetition promotes efficient and effective learning. _Policy Insights from the Behavioral and Brain Sciences, 3_(1), 12–19. [Google Scholar](https://scholar.google.com/scholar?q=Kang+Spaced+repetition+promotes+efficient+and+effective+learning)

[^10]: Nakata, T. (2015). Effects of expanding and equal spacing on second language vocabulary learning. _Studies in Second Language Acquisition, 37_(4), 677–711. [Google Scholar](https://scholar.google.com/scholar?q=Nakata+Effects+of+expanding+and+equal+spacing+second+language+vocabulary)

[^11]: Wozniak, P. A., & Gorzelańczyk, E. J. (1994). Optimization of repetition spacing in the practice of learning. _Acta Neurobiologiae Experimentalis, 54_, 59–62. [Google Scholar](https://scholar.google.com/scholar?q=Optimization+of+repetition+spacing+Wozniak+Gorzelanczyk)

[^12]: Ye, J., et al. A stochastic shortest path algorithm for optimizing spaced repetition scheduling. [Google Scholar](https://scholar.google.com/scholar?q=A+stochastic+shortest+path+algorithm+for+optimizing+spaced+repetition+scheduling)

[^13]: Nation, I. S. P. (2001). _Learning Vocabulary in Another Language_. Cambridge University Press. [Google Scholar](https://scholar.google.com/scholar?q=Nation+Learning+Vocabulary+in+Another+Language+2001)

[^14]: Webb, S. (2007). The effects of repetition on vocabulary knowledge. _Applied Linguistics, 28_(1), 46–65. [Google Scholar](https://scholar.google.com/scholar?q=Webb+effects+of+repetition+on+vocabulary+knowledge)

[^15]: Uchihara, T., Webb, S., & Yanagisawa, A. (2019). The effects of repetition on incidental vocabulary learning: A meta-analysis of correlational studies. _Language Learning, 69_(3), 559–599. [Google Scholar](https://scholar.google.com/scholar?q=effects+repetition+incidental+vocabulary+learning+meta-analysis+Uchihara)

[^16]: Laufer, B., & Hulstijn, J. (2001). Incidental vocabulary acquisition in a second language: The construct of task-induced involvement. _Applied Linguistics, 22_(1), 1–26. [Google Scholar](https://scholar.google.com/scholar?q=Laufer+Hulstijn+task-induced+involvement)

[^17]: Nakata, T. (2008). English vocabulary learning with word lists, word cards and computers. _ReCALL, 20_(1), 3–20. [Google Scholar](https://scholar.google.com/scholar?q=Nakata+English+vocabulary+learning+word+lists+word+cards+computers)

[^18]: Webb, S., Yanagisawa, A., & Uchihara, T. (2020). How effective are intentional vocabulary-learning activities? A meta-analysis. _The Modern Language Journal, 104_(4), 715–738. [Google Scholar](https://scholar.google.com/scholar?q=How+effective+intentional+vocabulary-learning+activities+meta-analysis)

[^19]: Swain, M. (1985). Communicative competence: Some roles of comprehensible input and comprehensible output. In _Input in Second Language Acquisition_. [Google Scholar](https://scholar.google.com/scholar?q=Swain+comprehensible+output+hypothesis+1985)

[^20]: Saito, K. (2012). Effects of instruction on L2 pronunciation development: A synthesis of 15 quasi-experimental intervention studies. _TESOL Quarterly, 46_(4), 842–854. [Google Scholar](https://scholar.google.com/scholar?q=Saito+Effects+instruction+L2+pronunciation+development+synthesis)

[^21]: Martin, I. A. (2020). Pronunciation can be acquired outside the classroom. _The Modern Language Journal, 104_(2), 457–479. [Google Scholar](https://scholar.google.com/scholar?q=Pronunciation+can+be+acquired+outside+the+classroom+Martin)

[^22]: Martin, I. A., & Sippel, L. (2021). Is giving better than receiving? The effects of peer and teacher feedback on L2 pronunciation skills. _Journal of Second Language Pronunciation, 7_(1), 62–88. [Google Scholar](https://scholar.google.com/scholar?q=Martin+Sippel+giving+better+receiving+pronunciation)

[^23]: Hamada, Y. (2019). _Shadowing: What is It? How to Use It. Where Will It Go?_ Routledge. [Google Scholar](https://scholar.google.com/scholar?q=Hamada+Shadowing+What+is+It+How+to+Use+It)

[^24]: Kadota, S. (2019). _Shadowing as a Practice in Second Language Acquisition_. Routledge. [Google Scholar](https://scholar.google.com/scholar?q=Kadota+Shadowing+as+a+Practice+in+Second+Language+Acquisition)

[^25]: Foote, J. A., & McDonough, K. (2017). Using shadowing with mobile technology to improve L2 pronunciation. _Journal of Second Language Pronunciation, 3_(1), 34–56. [Google Scholar](https://scholar.google.com/scholar?q=Foote+McDonough+shadowing+mobile+technology+pronunciation)

[^26]: Baddeley, A. (1992). Working memory. _Science, 255_(5044), 556–559. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1126/science.1736359)

[^27]: Paivio, A. (1986). _Mental Representations: A Dual Coding Approach_. Oxford University Press. [Google Scholar](https://scholar.google.com/scholar?q=Paivio+Mental+Representations+Dual+Coding+Approach)

[^28]: Mayer, R. E. (2009). _Multimedia Learning_ (2nd ed.). Cambridge University Press. [Google Scholar](https://scholar.google.com/scholar?q=Mayer+Multimedia+Learning+second+edition)

[^29]: Bjork, E. L., & Bjork, R. A. (2011). Making things hard on yourself, but in a good way: Creating desirable difficulties to enhance learning. [Google Scholar](https://scholar.google.com/scholar?q=Bjork+Making+things+hard+on+yourself+desirable+difficulties)

[^30]: Soderstrom, N. C., & Bjork, R. A. (2015). Learning versus performance: An integrative review. _Perspectives on Psychological Science, 10_(2), 176–199. [Google Scholar](https://scholar.google.com/scholar_lookup?doi=10.1177/1745691615569000)
