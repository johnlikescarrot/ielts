export type ASTNodeType = 'Root' | 'Paragraph' | 'Sentence' | 'Clause' | 'Token';

export type SentenceType = 'simple' | 'compound' | 'complex' | 'compound-complex';

export type ClauseType = 'independent' | 'subordinate' | 'relative' | 'conditional' | 'passive';

export interface TokenNode {
  type: 'Token';
  raw: string;
  normalized: string;
  isWord: boolean;
  isPunctuation: boolean;
  isAcademic: boolean;
  isTransition: boolean;
  isPassiveAux: boolean;
  isModal: boolean;
  posTag?: string;
  awlSublist?: number;
  startIndex: number;
  endIndex: number;
}

export interface ClauseNode {
  type: 'Clause';
  clauseType: ClauseType;
  tokens: TokenNode[];
  text: string;
  hasPassive: boolean;
  hasRelative: boolean;
  hasConditional: boolean;
}

export interface SentenceNode {
  type: 'Sentence';
  sentenceType: SentenceType;
  clauses: ClauseNode[];
  tokens: TokenNode[];
  text: string;
  wordCount: number;
  startIndex: number;
  endIndex: number;
}

export interface ParagraphNode {
  type: 'Paragraph';
  paragraphIndex: number;
  sentences: SentenceNode[];
  text: string;
  wordCount: number;
  hasTopicSentence: boolean;
}

export interface EssayAST {
  type: 'Root';
  paragraphs: ParagraphNode[];
  rawText: string;
  totalWords: number;
  totalSentences: number;
  totalParagraphs: number;
}

export interface LexicalMetrics {
  totalWords: number;
  uniqueWords: number;
  ttr: number; // Type-Token Ratio
  awlWords: string[];
  awlDensityPercent: number;
  repeatedWords: { word: string; count: number }[];
  rareWordCount: number;
  collocationMatches: string[];
}

export interface GrammaticalMetrics {
  sentenceCount: number;
  averageSentenceLength: number;
  sentenceTypeCounts: Record<SentenceType, number>;
  passiveVoiceCount: number;
  conditionalCount: number;
  relativeClauseCount: number;
  complexSentenceRatio: number;
  nominalizationCount: number;
}

export interface CoherenceMetrics {
  paragraphCount: number;
  transitionWordsUsed: string[];
  transitionWordCount: number;
  transitionsPerParagraph: number;
  cohesionScore: number;
  hasIntroAndConclusion: boolean;
}

export interface TaskMetrics {
  wordCount: number;
  targetWordCount: number;
  isWordCountSufficient: boolean;
  wordCountPenalty: number;
  promptKeywordsMatched: string[];
  keywordCoveragePercent: number;
}

export interface CriterionFeedback {
  band: number;
  scoreExplanationEn: string;
  scoreExplanationVi: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface EssayEvaluationReport {
  overallBand: number;
  taskAchievement: CriterionFeedback;
  coherenceCohesion: CriterionFeedback;
  lexicalResource: CriterionFeedback;
  grammaticalRange: CriterionFeedback;
  metrics: {
    lexical: LexicalMetrics;
    grammatical: GrammaticalMetrics;
    coherence: CoherenceMetrics;
    task: TaskMetrics;
    readability: {
      fleschKincaidGrade: number;
      readingEase: number;
      ari: number;
      lexicalDensity: number;
    };
  };
  ast: EssayAST;
  analyzedAt: string;
}
