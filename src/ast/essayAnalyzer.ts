import { parseEssayToAST } from './astParser';
import { calculateReadability } from './readability';
import { COMMON_COLLOCATIONS, COMMON_COLLOCATIONS_REGEX } from './awlList';
import {
  EssayAST,
  EssayEvaluationReport,
  LexicalMetrics,
  GrammaticalMetrics,
  CoherenceMetrics,
  TaskMetrics,
  CriterionFeedback,
  SentenceType
} from './types';

export function extractLexicalMetrics(ast: EssayAST): LexicalMetrics {
  const allTokens = ast.paragraphs.flatMap(p => p.sentences.flatMap(s => s.tokens));
  const words = allTokens.filter(t => t.isWord).map(t => t.normalized);
  const totalWords = words.length;

  if (totalWords === 0) {
    return {
      totalWords: 0,
      uniqueWords: 0,
      ttr: 0,
      awlWords: [],
      awlDensityPercent: 0,
      repeatedWords: [],
      rareWordCount: 0,
      collocationMatches: [],
    };
  }

  const wordFrequencies: Record<string, number> = {};
  const awlSet = new Set<string>();

  words.forEach(w => {
    wordFrequencies[w] = (wordFrequencies[w] || 0) + 1;
  });

  allTokens.forEach(t => {
    if (t.isWord && t.isAcademic) {
      awlSet.add(t.normalized);
    }
  });

  const uniqueWords = Object.keys(wordFrequencies).length;
  const ttr = Math.round((uniqueWords / totalWords) * 100) / 100;
  const awlDensityPercent = Math.round((awlSet.size / totalWords) * 1000) / 10;

  // Identify high frequency repeated content words (excluding standard stop words)
  const stopWords = new Set(['the', 'and', 'to', 'of', 'a', 'in', 'that', 'is', 'for', 'it', 'with', 'as', 'are', 'on', 'this', 'by', 'be']);
  const repeatedWords = Object.entries(wordFrequencies)
    .filter(([word, count]) => !stopWords.has(word) && count >= 4 && word.length > 3)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  // Check Collocations
  const rawLower = ast.rawText.toLowerCase();

  let collocationMatches: string[] = [];
  const matches = rawLower.match(COMMON_COLLOCATIONS_REGEX);

  if (matches) {
    const matchedSet = new Set(matches);
    // Keep the original order of COMMON_COLLOCATIONS
    collocationMatches = COMMON_COLLOCATIONS.filter(c => matchedSet.has(c));
  }

  return {
    totalWords,
    uniqueWords,
    ttr,
    awlWords: Array.from(awlSet),
    awlDensityPercent,
    repeatedWords,
    rareWordCount: awlSet.size,
    collocationMatches,
  };
}

export function extractGrammaticalMetrics(ast: EssayAST): GrammaticalMetrics {
  const allSentences = ast.paragraphs.flatMap(p => p.sentences);
  const sentenceCount = allSentences.length;

  if (sentenceCount === 0) {
    return {
      sentenceCount: 0,
      averageSentenceLength: 0,
      sentenceTypeCounts: { simple: 0, compound: 0, complex: 0, 'compound-complex': 0 },
      passiveVoiceCount: 0,
      conditionalCount: 0,
      relativeClauseCount: 0,
      complexSentenceRatio: 0,
      nominalizationCount: 0,
    };
  }

  const sentenceTypeCounts: Record<SentenceType, number> = {
    simple: 0,
    compound: 0,
    complex: 0,
    'compound-complex': 0,
  };

  let passiveVoiceCount = 0;
  let conditionalCount = 0;
  let relativeClauseCount = 0;
  let totalSentenceLength = 0;
  let nominalizationCount = 0;

  for (const s of allSentences) {
    sentenceTypeCounts[s.sentenceType] = (sentenceTypeCounts[s.sentenceType] || 0) + 1;
    totalSentenceLength += s.wordCount;
    passiveVoiceCount += s.passiveVoiceCount;
    conditionalCount += s.conditionalCount;
    relativeClauseCount += s.relativeClauseCount;
    nominalizationCount += s.nominalizationCount;
  }

  const complexSentenceCount = sentenceTypeCounts.complex + sentenceTypeCounts['compound-complex'];
  const complexSentenceRatio = Math.round((complexSentenceCount / sentenceCount) * 100) / 100;
  const averageSentenceLength = Math.round((totalSentenceLength / sentenceCount) * 10) / 10;

  return {
    sentenceCount,
    averageSentenceLength,
    sentenceTypeCounts,
    passiveVoiceCount,
    conditionalCount,
    relativeClauseCount,
    complexSentenceRatio,
    nominalizationCount,
  };
}

export function extractCoherenceMetrics(ast: EssayAST): CoherenceMetrics {
  const paragraphCount = ast.paragraphs.length;
  const transitionWordsSet = new Set<string>();

  for (const p of ast.paragraphs) {
    for (const s of p.sentences) {
      for (const t of s.tokens) {
        if (t.isTransition) {
          transitionWordsSet.add(t.normalized);
        }
      }
    }
  }

  const transitionWordCount = transitionWordsSet.size;
  const transitionsPerParagraph = paragraphCount > 0 ? Math.round((transitionWordCount / paragraphCount) * 10) / 10 : 0;

  let cohesionScore = 0;
  if (paragraphCount >= 3 && paragraphCount <= 5) cohesionScore += 35;
  else if (paragraphCount >= 2) cohesionScore += 20;

  if (transitionWordCount >= 6) cohesionScore += 35;
  else if (transitionWordCount >= 3) cohesionScore += 20;

  if (transitionsPerParagraph >= 1.2) cohesionScore += 30;
  else if (transitionsPerParagraph >= 0.8) cohesionScore += 20;

  const hasIntroAndConclusion = paragraphCount >= 4;

  return {
    paragraphCount,
    transitionWordsUsed: Array.from(transitionWordsSet),
    transitionWordCount,
    transitionsPerParagraph,
    cohesionScore: Math.min(100, cohesionScore),
    hasIntroAndConclusion,
  };
}

export function extractTaskMetrics(ast: EssayAST, targetWordCount = 250, promptKeywords: string[] = []): TaskMetrics {
  const wordCount = ast.totalWords;
  const isWordCountSufficient = wordCount >= targetWordCount;

  let wordCountPenalty = 0;
  if (wordCount < targetWordCount * 0.6) wordCountPenalty = 2.0;
  else if (wordCount < targetWordCount * 0.8) wordCountPenalty = 1.0;
  else if (wordCount < targetWordCount) wordCountPenalty = 0.5;

  const rawLower = ast.rawText.toLowerCase();
  const matchedKeywords = promptKeywords.filter(kw => rawLower.includes(kw.toLowerCase()));
  const keywordCoveragePercent = promptKeywords.length > 0 
    ? Math.round((matchedKeywords.length / promptKeywords.length) * 100) 
    : 100;

  return {
    wordCount,
    targetWordCount,
    isWordCountSufficient,
    wordCountPenalty,
    promptKeywordsMatched: matchedKeywords,
    keywordCoveragePercent,
  };
}

export function evaluateTaskResponse(task: TaskMetrics, paraCount: number): CriterionFeedback {
  let band = 6.0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (task.wordCount >= task.targetWordCount + 30) {
    band += 1.5;
    strengths.push('Exceeds minimum word requirement with comprehensive development.');
  } else if (task.wordCount >= task.targetWordCount) {
    band += 1.0;
    strengths.push('Meets required minimum word count.');
  } else {
    band -= task.wordCountPenalty;
    weaknesses.push(`Under length penalty: Wrote ${task.wordCount} words against ${task.targetWordCount} target.`);
    recommendations.push(`Expand each main body paragraph with 1 concrete real-world example.`);
  }

  if (paraCount >= 4) {
    band += 0.5;
    strengths.push('Well-structured layout with clear introduction, body paragraphs, and conclusion.');
  } else if (paraCount < 3) {
    band -= 0.5;
    weaknesses.push('Insufficient paragraph separation for academic essay format.');
    recommendations.push('Structure your essay into 4-5 clear paragraphs (Intro, Body 1, Body 2, Conclusion).');
  }

  band = Math.max(3.0, Math.min(9.0, Math.round(band * 2) / 2));

  return {
    band,
    scoreExplanationEn: `Task Response evaluated at Band ${band.toFixed(1)} based on length, topic coverage, and structural completeness.`,
    scoreExplanationVi: `Điểm Task Response đạt Band ${band.toFixed(1)} dựa trên độ dài, độ bao quát chủ đề và cấu trúc bài viết.`,
    strengths,
    weaknesses,
    recommendations,
  };
}

export function evaluateCoherenceCohesion(coherence: CoherenceMetrics, ast: EssayAST): CriterionFeedback {
  let band = 5.5;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (coherence.paragraphCount >= 4 && coherence.paragraphCount <= 5) {
    band += 1.5;
    strengths.push('Optimal 4-5 paragraph structure with balanced body length.');
  } else if (coherence.paragraphCount === 3) {
    band += 0.5;
    strengths.push('Basic paragraph division present.');
  } else {
    weaknesses.push('Essay lacks clear paragraph partitioning.');
    recommendations.push('Divide essay into Introduction, 2 distinct Body paragraphs, and a Conclusion.');
  }

  if (coherence.transitionWordCount >= 6) {
    band += 1.0;
    strengths.push(`Rich variety of ${coherence.transitionWordCount} transitional cohesive devices used.`);
  } else if (coherence.transitionWordCount >= 3) {
    band += 0.5;
    strengths.push('Uses some transition markers.');
  } else {
    weaknesses.push('Under-use of discourse markers linking ideas together.');
    recommendations.push('Incorporate discourse markers such as "Furthermore", "In contrast", "Consequently", and "For instance".');
  }

  // Check topic sentences
  const topicSentencesCount = ast.paragraphs.filter(p => p.hasTopicSentence).length;
  if (topicSentencesCount >= 2) {
    strengths.push('Clear topic sentences introduce main ideas in body paragraphs.');
  } else {
    recommendations.push('Ensure each body paragraph begins with a strong, focused topic sentence.');
  }

  band = Math.max(3.0, Math.min(9.0, Math.round(band * 2) / 2));

  return {
    band,
    scoreExplanationEn: `Coherence and Cohesion assessed at Band ${band.toFixed(1)} evaluating logical flow and discourse linking.`,
    scoreExplanationVi: `Điểm Mạch lạc và Liên kết (Coherence & Cohesion) đạt Band ${band.toFixed(1)} dựa trên tính liên kết câu và cấu trúc đoạn.`,
    strengths,
    weaknesses,
    recommendations,
  };
}

export function evaluateLexicalResource(lexical: LexicalMetrics): CriterionFeedback {
  let band = 5.5;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (lexical.awlWords.length >= 10) {
    band += 2.0;
    strengths.push(`Superior Academic Word List usage (${lexical.awlWords.length} unique AWL terms).`);
  } else if (lexical.awlWords.length >= 5) {
    band += 1.0;
    strengths.push(`Good academic vocabulary repertoire (${lexical.awlWords.length} AWL terms).`);
  } else {
    weaknesses.push('Limited academic vocabulary. Too reliant on informal/everyday language.');
    recommendations.push('Incorporate more Academic Word List (AWL) terms such as "facilitate", "substantiate", "comprehensive".');
  }

  if (lexical.ttr >= 0.55) {
    band += 0.5;
    strengths.push(`High lexical diversity with Type-Token Ratio of ${lexical.ttr}.`);
  } else if (lexical.ttr < 0.42 && lexical.totalWords > 100) {
    weaknesses.push('Frequent word repetition diminishes lexical variety.');
    recommendations.push('Use varied synonyms instead of repeating the same core nouns/verbs.');
  }

  if (lexical.collocationMatches.length >= 3) {
    band += 0.5;
    strengths.push(`Natural collocations detected: "${lexical.collocationMatches.slice(0, 2).join('", "')}".`);
  } else {
    recommendations.push('Use natural academic collocations (e.g., "play a vital role", "reap the benefits", "tackle the problem").');
  }

  band = Math.max(3.0, Math.min(9.0, Math.round(band * 2) / 2));

  return {
    band,
    scoreExplanationEn: `Lexical Resource evaluated at Band ${band.toFixed(1)} based on academic vocabulary, diversity and collocations.`,
    scoreExplanationVi: `Điểm Vốn từ vựng (Lexical Resource) đạt Band ${band.toFixed(1)} dựa trên mật độ từ học thuật và độ phong phú từ vựng.`,
    strengths,
    weaknesses,
    recommendations,
  };
}

export function evaluateGrammaticalRange(grammatical: GrammaticalMetrics): CriterionFeedback {
  let band = 5.5;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  const complexRatio = grammatical.complexSentenceRatio;

  if (complexRatio >= 0.55 && grammatical.sentenceCount >= 8) {
    band += 2.0;
    strengths.push(`Exceptional sentence variety with ${(complexRatio * 100).toFixed(0)}% complex/compound-complex structures.`);
  } else if (complexRatio >= 0.35) {
    band += 1.0;
    strengths.push(`Good syntactic variety with ${(complexRatio * 100).toFixed(0)}% complex sentences.`);
  } else {
    weaknesses.push('High proportion of simple sentences limits grammatical score.');
    recommendations.push('Combine simple sentences into complex structures using subordinators ("although", "whereas", "while").');
  }

  if (grammatical.passiveVoiceCount >= 2) {
    band += 0.5;
    strengths.push('Effective use of passive voice for academic objectivity.');
  } else {
    recommendations.push('Use passive voice constructions to achieve an objective academic tone.');
  }

  if (grammatical.relativeClauseCount >= 2 || grammatical.conditionalCount >= 1) {
    band += 0.5;
    strengths.push('Demonstrates advanced structures including relative clauses and conditionals.');
  } else {
    recommendations.push('Add relative clauses ("which", "who") or conditional sentences ("If..., ...") to boost grammatical score.');
  }

  band = Math.max(3.0, Math.min(9.0, Math.round(band * 2) / 2));

  return {
    band,
    scoreExplanationEn: `Grammatical Range & Accuracy evaluated at Band ${band.toFixed(1)} analyzing sentence variety and structural complexity.`,
    scoreExplanationVi: `Điểm Ngữ pháp (Grammatical Range & Accuracy) đạt Band ${band.toFixed(1)} dựa trên độ đa dạng cấu trúc câu và sự chuẩn xác.`,
    strengths,
    weaknesses,
    recommendations,
  };
}

export function analyzeEssay(essayText: string, targetWordCount = 250, promptKeywords: string[] = []): EssayEvaluationReport {
  const ast = parseEssayToAST(essayText);
  const words = ast.paragraphs.flatMap(p => p.sentences.flatMap(s => s.tokens.filter(t => t.isWord).map(t => t.raw)));
  const sentences = ast.paragraphs.flatMap(p => p.sentences.map(s => s.text));

  const readability = calculateReadability(essayText, words, sentences);
  const lexical = extractLexicalMetrics(ast);
  const grammatical = extractGrammaticalMetrics(ast);
  const coherence = extractCoherenceMetrics(ast);
  const task = extractTaskMetrics(ast, targetWordCount, promptKeywords);

  const trFeedback = evaluateTaskResponse(task, ast.paragraphs.length);
  const ccFeedback = evaluateCoherenceCohesion(coherence, ast);
  const lrFeedback = evaluateLexicalResource(lexical);
  const graFeedback = evaluateGrammaticalRange(grammatical);

  // Overall Band: average of 4 criteria rounded to nearest 0.5
  const rawAverage = (trFeedback.band + ccFeedback.band + lrFeedback.band + graFeedback.band) / 4;
  const overallBand = Math.round(rawAverage * 2) / 2;

  return {
    overallBand,
    taskAchievement: trFeedback,
    coherenceCohesion: ccFeedback,
    lexicalResource: lrFeedback,
    grammaticalRange: graFeedback,
    metrics: {
      lexical,
      grammatical,
      coherence,
      task,
      readability,
    },
    ast,
    analyzedAt: new Date().toISOString(),
  };
}
