import { EssayAST, ParagraphNode, SentenceNode, ClauseNode, TokenNode, SentenceType, ClauseType } from './types';
import { ACADEMIC_WORD_LIST, DISCOURSE_TRANSITIONS } from './awlList';

const SUBORDINATING_CONJUNCTIONS = new Set([
  'although', 'because', 'since', 'unless', 'until', 'whereas', 'while',
  'even though', 'provided that', 'inasmuch as', 'as long as', 'after', 'before', 'though'
]);

const COORDINATING_CONJUNCTIONS = new Set([
  'and', 'but', 'or', 'nor', 'for', 'yet', 'so'
]);

const RELATIVE_PRONOUNS = new Set([
  'which', 'who', 'whom', 'whose', 'that', 'whereby', 'wherein'
]);

const CONDITIONAL_MARKERS = new Set([
  'if', 'unless', 'provided', 'assuming', 'were', 'had', 'should'
]);

const PASSIVE_AUXILIARIES = new Set([
  'is', 'are', 'was', 'were', 'been', 'being', 'be'
]);

const MODAL_VERBS = new Set([
  'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'ought'
]);

const allTransitionPhrases = Object.values(DISCOURSE_TRANSITIONS).flat().map(p => p.toLowerCase());

export function tokenizeSentence(sentenceText: string, baseOffset = 0): TokenNode[] {
  const tokens: TokenNode[] = [];
  const regex = /([a-zA-Z0-9'-]+)|([.,!?;:()[\]"“”'’—–-])/g;
  let match;

  while ((match = regex.exec(sentenceText)) !== null) {
    const raw = match[0];
    const isPunctuation = /^[.,!?;:()[\]"“”'’—–-]+$/.test(raw);
    const isWord = !isPunctuation;
    const normalized = raw.toLowerCase().replace(/['’]s$/, '');
    const startIndex = baseOffset + match.index;
    const endIndex = startIndex + raw.length;

    const awlEntry = isWord ? ACADEMIC_WORD_LIST[normalized] : undefined;
    const isAcademic = !!awlEntry;
    const isPassiveAux = isWord && PASSIVE_AUXILIARIES.has(normalized);
    const isModal = isWord && MODAL_VERBS.has(normalized);

    tokens.push({
      type: 'Token',
      raw,
      normalized,
      isWord,
      isPunctuation,
      isAcademic,
      isTransition: false, // will mark in phase 2
      isPassiveAux,
      isModal,
      awlSublist: awlEntry?.sublist,
      startIndex,
      endIndex,
    });
  }

  // Multi-word & single-word transition identification
  const lowerSentence = sentenceText.toLowerCase();
  for (const phrase of allTransitionPhrases) {
    let pos = lowerSentence.indexOf(phrase);
    while (pos !== -1) {
      const pEnd = pos + phrase.length;
      tokens.forEach(tok => {
        const tokRelStart = tok.startIndex - baseOffset;
        const tokRelEnd = tok.endIndex - baseOffset;
        if (tokRelStart >= pos && tokRelEnd <= pEnd) {
          tok.isTransition = true;
        }
      });
      pos = lowerSentence.indexOf(phrase, pos + 1);
    }
  }

  return tokens;
}

export function parseClauses(sentenceText: string, tokens: TokenNode[]): ClauseNode[] {
  const words = tokens.filter(t => t.isWord);
  if (words.length === 0) {
    return [{
      type: 'Clause',
      clauseType: 'independent',
      tokens,
      text: sentenceText,
      hasPassive: false,
      hasRelative: false,
      hasConditional: false,
    }];
  }

  // Detect passive voice (Auxiliary + word ending with 'ed' or known irregular participle)
  let hasPassive = false;
  for (let i = 0; i < tokens.length - 1; i++) {
    if (tokens[i].isPassiveAux && tokens[i + 1].isWord && (tokens[i + 1].normalized.endsWith('ed') || ['built', 'seen', 'done', 'given', 'known', 'taken', 'made', 'shown', 'drawn'].includes(tokens[i + 1].normalized))) {
      hasPassive = true;
      break;
    }
  }

  // Detect conditional
  const hasConditional = words.some(w => CONDITIONAL_MARKERS.has(w.normalized));

  // Detect relative clause
  const hasRelative = words.some(w => RELATIVE_PRONOUNS.has(w.normalized));

  // Split clauses by punctuation and conjunction boundaries
  const clauses: ClauseNode[] = [];
  let currentTokens: TokenNode[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const isSplitter = tok.raw === ';' || tok.raw === ',' || tok.raw === ':' || tok.raw === '—' || tok.raw === '--';

    currentTokens.push(tok);

    if (isSplitter || i === tokens.length - 1) {
      if (currentTokens.length > 0) {
        const clauseWords = currentTokens.filter(t => t.isWord);
        const firstWord = clauseWords[0]?.normalized || '';
        let cType: ClauseType = 'independent';

        if (SUBORDINATING_CONJUNCTIONS.has(firstWord)) {
          cType = 'subordinate';
        } else if (RELATIVE_PRONOUNS.has(firstWord)) {
          cType = 'relative';
        } else if (hasConditional && (firstWord === 'if' || firstWord === 'unless')) {
          cType = 'conditional';
        }

        clauses.push({
          type: 'Clause',
          clauseType: cType,
          tokens: [...currentTokens],
          text: currentTokens.map(t => t.raw).join(' '),
          hasPassive,
          hasRelative,
          hasConditional,
        });
        currentTokens = [];
      }
    }
  }

  if (clauses.length === 0) {
    clauses.push({
      type: 'Clause',
      clauseType: 'independent',
      tokens,
      text: sentenceText,
      hasPassive,
      hasRelative,
      hasConditional,
    });
  }

  return clauses;
}

export function classifySentenceType(clauses: ClauseNode[], tokens: TokenNode[]): SentenceType {
  const words = tokens.filter(t => t.isWord);
  if (words.length < 4) return 'simple';

  const hasSubordinate = clauses.some(c => c.clauseType === 'subordinate' || c.clauseType === 'relative' || c.clauseType === 'conditional') ||
    words.some(w => SUBORDINATING_CONJUNCTIONS.has(w.normalized) || RELATIVE_PRONOUNS.has(w.normalized));
  
  const hasCoordination = words.some(w => COORDINATING_CONJUNCTIONS.has(w.normalized));

  if (hasSubordinate && hasCoordination && clauses.length >= 2) {
    return 'compound-complex';
  } else if (hasSubordinate) {
    return 'complex';
  } else if (hasCoordination && clauses.length >= 2) {
    return 'compound';
  }
  return 'simple';
}

export function splitIntoSentences(paragraphText: string, baseOffset = 0): SentenceNode[] {
  const sentenceNodes: SentenceNode[] = [];
  // Match sentence ending punctuation followed by space or end of string
  const sentenceRegex = /([^.!?]+(?:[.!?]+|$))/g;
  let match;

  while ((match = sentenceRegex.exec(paragraphText)) !== null) {
    const rawSentence = match[0].trim();
    if (!rawSentence) continue;

    const sentenceStartIndex = baseOffset + match.index;
    const sentenceEndIndex = sentenceStartIndex + rawSentence.length;

    const tokens = tokenizeSentence(rawSentence, sentenceStartIndex);
    const clauses = parseClauses(rawSentence, tokens);
    const sentenceType = classifySentenceType(clauses, tokens);
    const wordCount = tokens.filter(t => t.isWord).length;

    if (wordCount > 0) {
      sentenceNodes.push({
        type: 'Sentence',
        sentenceType,
        clauses,
        tokens,
        text: rawSentence,
        wordCount,
        startIndex: sentenceStartIndex,
        endIndex: sentenceEndIndex,
      });
    }
  }

  return sentenceNodes;
}

export function parseEssayToAST(rawText: string): EssayAST {
  if (!rawText || !rawText.trim()) {
    return {
      type: 'Root',
      paragraphs: [],
      rawText: '',
      totalWords: 0,
      totalSentences: 0,
      totalParagraphs: 0,
    };
  }

  // Split by double newline or single newline with indentation
  const rawParagraphs = rawText.split(/\n\s*\n|\r\n\s*\r\n/).map(p => p.trim()).filter(p => p.length > 0);

  let currentOffset = 0;
  const paragraphs: ParagraphNode[] = [];
  let totalWordCount = 0;
  let totalSentenceCount = 0;

  rawParagraphs.forEach((pText, index) => {
    const pStartIndex = rawText.indexOf(pText, currentOffset);
    currentOffset = pStartIndex + pText.length;

    const sentences = splitIntoSentences(pText, pStartIndex);
    const pWordCount = sentences.reduce((sum, s) => sum + s.wordCount, 0);

    totalWordCount += pWordCount;
    totalSentenceCount += sentences.length;

    // Check topic sentence (first sentence has substantive structure)
    const hasTopicSentence = sentences.length > 0 && sentences[0].wordCount >= 8;

    paragraphs.push({
      type: 'Paragraph',
      paragraphIndex: index,
      sentences,
      text: pText,
      wordCount: pWordCount,
      hasTopicSentence,
    });
  });

  return {
    type: 'Root',
    paragraphs,
    rawText,
    totalWords: totalWordCount,
    totalSentences: totalSentenceCount,
    totalParagraphs: paragraphs.length,
  };
}
