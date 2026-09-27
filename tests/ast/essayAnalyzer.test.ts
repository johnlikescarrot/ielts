import { describe, it, expect } from 'vitest';
import {
  analyzeEssay,
  extractLexicalMetrics,
  extractGrammaticalMetrics,
  extractCoherenceMetrics,
  extractTaskMetrics,
  evaluateTaskResponse,
  evaluateCoherenceCohesion,
  evaluateLexicalResource,
  evaluateGrammaticalRange
} from '../../src/ast/essayAnalyzer';
import { parseEssayToAST } from '../../src/ast/astParser';

describe('essayAnalyzer', () => {
  const band9Essay = `The rapid proliferation of educational technology and generative artificial intelligence has sparked a fierce debate regarding the future of pedagogy. While technological enthusiasts contend that intelligent software will soon render human educators redundant, I firmly believe that teachers remain indispensable facilitators of emotional empathy, critical thinking, and moral mentorship.

On the one hand, advocates of automated education argue that digital platforms offer unprecedented scalability and personalization. Advanced algorithmic tutors can analyze individual learning trajectories, dynamically tailoring exercises to address specific conceptual deficits. Furthermore, digital coursework eliminates geographical and economic barriers, enabling students in remote regions to access top-tier academic curricula without exorbitant tuition fees. Consequently, computerized instruction optimizes learning efficiency and democratizes knowledge dissemination on an unprecedented global scale for all students.

On the other hand, the human dimension of teaching encompasses vital psychological and pedagogical faculties that artificial algorithms cannot replicate. Human educators do not merely transmit static data; they foster motivation, inspire intellectual curiosity, and cultivate social-emotional resilience. In collaborative seminar environments, a perceptive instructor can identify subtle non-verbal cues indicating student frustration or disengagement, promptly adapting instruction to reassure learners. Moreover, cultivating ethical reasoning and complex argumentation requires interactive philosophical dialogue with experienced human mentors who model nuanced cultural perspectives.

In conclusion, while cutting-edge digital platforms serve as powerful auxiliary instruments to augment instructional delivery, they cannot replace the empathetic and inspirational core of human educators. A hybrid pedagogical paradigm that harmoniously integrates algorithmic efficiency with compassionate human mentorship represents the optimal future for global education across all institutions worldwide.`;

  it('evaluates a high-scoring Band 8.5/9.0 essay accurately', () => {
    const report = analyzeEssay(band9Essay, 250, ['technology', 'education', 'teachers']);

    expect(report.overallBand).toBeGreaterThanOrEqual(7.5);
    expect(report.taskAchievement.band).toBeGreaterThanOrEqual(7.5);
    expect(report.coherenceCohesion.band).toBeGreaterThanOrEqual(7.5);
    expect(report.lexicalResource.band).toBeGreaterThanOrEqual(7.0);
    expect(report.grammaticalRange.band).toBeGreaterThanOrEqual(7.0);

    expect(report.metrics.lexical.awlWords.length).toBeGreaterThan(5);
    expect(report.metrics.grammatical.sentenceCount).toBeGreaterThan(5);
    expect(report.metrics.coherence.paragraphCount).toBe(4);
  });

  it('handles empty or minimal essay evaluation gracefully', () => {
    const emptyAst = parseEssayToAST('');
    const lexical = extractLexicalMetrics(emptyAst);
    expect(lexical.totalWords).toBe(0);

    const grammatical = extractGrammaticalMetrics(emptyAst);
    expect(grammatical.sentenceCount).toBe(0);

    const coherence = extractCoherenceMetrics(emptyAst);
    expect(coherence.paragraphCount).toBe(0);

    const task = extractTaskMetrics(emptyAst, 250);
    expect(task.wordCount).toBe(0);
    expect(task.isWordCountSufficient).toBe(false);

    const report = analyzeEssay('Short sentence here.', 250);
    expect(report.overallBand).toBeLessThanOrEqual(5.5);
    expect(report.taskAchievement.weaknesses.length).toBeGreaterThan(0);
  });

  it('evaluates criteria under different conditions', () => {
    // Under-length task response
    const taskUnder = {
      wordCount: 120,
      targetWordCount: 250,
      isWordCountSufficient: false,
      wordCountPenalty: 2.0,
      promptKeywordsMatched: [],
      keywordCoveragePercent: 0,
    };
    const trReport = evaluateTaskResponse(taskUnder, 2);
    expect(trReport.band).toBeLessThan(6.0);
    expect(trReport.weaknesses.some(w => w.includes('Under length'))).toBe(true);

    // Coherence with 3 paragraphs & low transitions
    const ccReport = evaluateCoherenceCohesion({
      paragraphCount: 3,
      transitionWordsUsed: ['however'],
      transitionWordCount: 1,
      transitionsPerParagraph: 0.33,
      cohesionScore: 20,
      hasIntroAndConclusion: false,
    }, parseEssayToAST('Paragraph 1.\n\nParagraph 2.\n\nParagraph 3.'));
    expect(ccReport.recommendations.length).toBeGreaterThan(0);

    // Lexical with low AWL and low TTR
    const lrReport = evaluateLexicalResource({
      totalWords: 200,
      uniqueWords: 50,
      ttr: 0.25,
      awlWords: [],
      awlDensityPercent: 0,
      repeatedWords: [{ word: 'good', count: 10 }],
      rareWordCount: 0,
      collocationMatches: [],
    });
    expect(lrReport.weaknesses.length).toBeGreaterThan(0);

    // Grammatical with simple sentences only
    const graReport = evaluateGrammaticalRange({
      sentenceCount: 10,
      averageSentenceLength: 10,
      sentenceTypeCounts: { simple: 10, compound: 0, complex: 0, 'compound-complex': 0 },
      passiveVoiceCount: 0,
      conditionalCount: 0,
      relativeClauseCount: 0,
      complexSentenceRatio: 0,
      nominalizationCount: 0,
    });
    expect(graReport.band).toBeLessThanOrEqual(5.5);

    const mediumLengthAst = parseEssayToAST(Array.from({ length: 180 }, () => 'word').join(' '));
    expect(extractTaskMetrics(mediumLengthAst, 250).wordCountPenalty).toBe(1.0);

    const exactLengthTask = {
      ...taskUnder,
      wordCount: 250,
      isWordCountSufficient: true,
      wordCountPenalty: 0,
    };
    expect(evaluateTaskResponse(exactLengthTask, 3).band).toBeGreaterThan(6.0);
    expect(evaluateTaskResponse({ ...exactLengthTask, wordCount: 290 }, 4).strengths).toContain(
      'Exceeds minimum word requirement with comprehensive development.'
    );

    const twoParagraphAst = parseEssayToAST('Furthermore, ideas connect. However, examples help.\n\nMoreover, practice works.');
    const midCohesion = extractCoherenceMetrics(twoParagraphAst);
    expect(midCohesion.cohesionScore).toBeGreaterThan(20);

    const onePerParagraphAst = parseEssayToAST('Furthermore, ideas connect.\n\nHowever, examples help.\n\nMoreover, practice works.');
    expect(extractCoherenceMetrics(onePerParagraphAst).transitionsPerParagraph).toBe(1);

    const highCohesionAst = parseEssayToAST(
      'Furthermore, ideas connect. Moreover, examples help.\n\nHowever, practice works. Consequently, results improve.\n\nIn contrast, shortcuts fail. Therefore, effort matters.'
    );
    const highCohesion = extractCoherenceMetrics(highCohesionAst);
    expect(highCohesion.transitionWordCount).toBeGreaterThanOrEqual(6);
    expect(highCohesion.cohesionScore).toBe(100);

    const highLexical = evaluateLexicalResource({
      totalWords: 200,
      uniqueWords: 150,
      ttr: 0.75,
      awlWords: Array.from({ length: 10 }, (_, index) => `academic${index}`),
      awlDensityPercent: 5,
      repeatedWords: [],
      rareWordCount: 10,
      collocationMatches: ['play a vital role', 'reap the benefits', 'tackle the problem'],
    });
    expect(highLexical.strengths).toHaveLength(3);

    const advancedGrammar = evaluateGrammaticalRange({
      sentenceCount: 10,
      averageSentenceLength: 20,
      sentenceTypeCounts: { simple: 1, compound: 1, complex: 6, 'compound-complex': 2 },
      passiveVoiceCount: 2,
      conditionalCount: 1,
      relativeClauseCount: 2,
      complexSentenceRatio: 0.8,
      nominalizationCount: 4,
    });
    expect(advancedGrammar.band).toBeGreaterThanOrEqual(8.5);
  });
});
