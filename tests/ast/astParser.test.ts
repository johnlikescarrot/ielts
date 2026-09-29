import { describe, it, expect } from 'vitest';
import {
  tokenizeSentence,
  parseClauses,
  classifySentenceType,
  splitIntoSentences,
  parseEssayToAST
} from '../../src/ast/astParser';

describe('astParser', () => {
  it('tokenizes sentence and marks AWL words and transitions', () => {
    const tokens = tokenizeSentence('Furthermore, we must analyze the significant impact of technology.');
    expect(tokens.length).toBeGreaterThan(0);
    
    const furthermoreTok = tokens.find(t => t.normalized === 'furthermore');
    expect(furthermoreTok).toBeDefined();
    expect(furthermoreTok?.isTransition).toBe(true);

    const analyzeTok = tokens.find(t => t.normalized === 'analyze');
    expect(analyzeTok).toBeDefined();
    expect(analyzeTok?.isAcademic).toBe(true);
    expect(analyzeTok?.awlSublist).toBe(1);

    const punctuationTok = tokens.find(t => t.raw === '.');
    expect(punctuationTok?.isPunctuation).toBe(true);
    expect(punctuationTok?.isWord).toBe(false);
  });

  it('handles empty or multi-word transitions', () => {
    const tokens = tokenizeSentence('On the other hand, empirical evidence was shown.');
    expect(tokens.some(t => t.isTransition)).toBe(true);
  });

  it('parses clauses correctly for simple and complex structures', () => {
    const sentence = 'Although technology evolves quickly, human teachers remain indispensable.';
    const tokens = tokenizeSentence(sentence);
    const clauses = parseClauses(sentence, tokens);

    expect(clauses.length).toBeGreaterThanOrEqual(2);
    expect(clauses.some(c => c.clauseType === 'subordinate')).toBe(true);
  });

  it('handles empty tokens in clause parser', () => {
    const clauses = parseClauses('', []);
    expect(clauses.length).toBe(1);
    expect(clauses[0].clauseType).toBe('independent');
  });

  it('detects passive voice and conditionals in clauses', () => {
    const sentence = 'If the problem was analyzed carefully, results were shown.';
    const tokens = tokenizeSentence(sentence);
    const clauses = parseClauses(sentence, tokens);

    expect(clauses.some(c => c.hasPassive)).toBe(true);
    expect(clauses.some(c => c.hasConditional)).toBe(true);
    expect(clauses.some(c => c.clauseType === 'conditional')).toBe(true);
  });

  it('detects relative clauses with relative pronouns', () => {
    const sentence = 'The policy, which was implemented last year, produced positive outcomes.';
    const tokens = tokenizeSentence(sentence);
    const clauses = parseClauses(sentence, tokens);

    expect(clauses.some(c => c.clauseType === 'relative' || c.hasRelative)).toBe(true);
  });

  it('detects conditional clauses starting with unless', () => {
    const sentence = 'Unless authorities take measures, pollution will worsen.';
    const tokens = tokenizeSentence(sentence);
    const clauses = parseClauses(sentence, tokens);

    expect(clauses.some(c => c.clauseType === 'conditional' || c.hasConditional)).toBe(true);
  });

  it('detects passive voice with irregular verbs', () => {
    const sentence = 'The picture was drawn by an artist.';
    const tokens = tokenizeSentence(sentence);
    const clauses = parseClauses(sentence, tokens);

    expect(clauses.some(c => c.hasPassive)).toBe(true);
  });

  it('classifies sentence types: simple, compound, complex, compound-complex', () => {
    const simpleTokens = tokenizeSentence('The cat sat on the mat.');
    const simpleClauses = parseClauses('The cat sat on the mat.', simpleTokens);
    expect(classifySentenceType(simpleClauses, simpleTokens)).toBe('simple');

    const complexTokens = tokenizeSentence('Because solar power is sustainable, governments allocate funds to it.');
    const complexClauses = parseClauses('Because solar power is sustainable, governments allocate funds to it.', complexTokens);
    expect(classifySentenceType(complexClauses, complexTokens)).toBe('complex');

    const compoundTokens = tokenizeSentence('Solar power is clean, but fossil fuels are still widely used.');
    const compoundClauses = parseClauses('Solar power is clean, but fossil fuels are still widely used.', compoundTokens);
    expect(classifySentenceType(compoundClauses, compoundTokens)).toBe('compound');

    const compComplexTokens = tokenizeSentence('Although solar energy is clean, fossil fuels are still used, and economies depend on them.');
    const compComplexClauses = parseClauses('Although solar energy is clean, fossil fuels are still used, and economies depend on them.', compComplexTokens);
    expect(classifySentenceType(compComplexClauses, compComplexTokens)).toBe('compound-complex');

    // Short sentences default to simple
    const shortTokens = tokenizeSentence('It is.');
    expect(classifySentenceType([], shortTokens)).toBe('simple');
  });

  it('splits paragraphs into sentences accurately', () => {
    const paragraph = 'Education is vital. It prepares individuals for the future! Are schools doing enough?';
    const sentences = splitIntoSentences(paragraph);
    expect(sentences.length).toBe(3);
    expect(sentences[0].wordCount).toBe(3);
  });

  it('parses full essay text to AST', () => {
    const essay = `First paragraph introduces the topic of climate mitigation. Furthermore, policies are required.

Second paragraph discusses renewable alternatives such as solar and wind power. Consequently, emissions decrease.

In conclusion, concerted global efforts are indispensable.`;

    const ast = parseEssayToAST(essay);
    expect(ast.totalParagraphs).toBe(3);
    expect(ast.totalSentences).toBe(5);
    expect(ast.totalWords).toBeGreaterThan(20);
    expect(ast.paragraphs[0].hasTopicSentence).toBe(true);
  });

  it('handles empty essay parsing to AST', () => {
    const emptyAst = parseEssayToAST('');
    expect(emptyAst.totalWords).toBe(0);
    expect(emptyAst.totalParagraphs).toBe(0);
    expect(emptyAst.paragraphs.length).toBe(0);
  });

  it('does not detect passive voice when auxiliary is missing', () => {
    const sentence = 'I drawn a picture and played outside.';
    const tokens = tokenizeSentence(sentence);
    const clauses = parseClauses(sentence, tokens);

    expect(clauses.some(c => c.hasPassive)).toBe(false);
  });

  it('detects irregular passive voice successfully', () => {
    const sentence = 'The map was drawn by an expert.';
    const tokens = tokenizeSentence(sentence);
    const clauses = parseClauses(sentence, tokens);

    expect(clauses.some(c => c.hasPassive)).toBe(true);
  });
});
