/**
 * Readability & Lexical Complexity Metrics Calculator
 * Implements Flesch-Kincaid, ARI, Gunning Fog, and Lexical Density algorithms.
 */

export function countSyllables(word: string): number {
  const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleanWord) return 0;
  if (cleanWord.length <= 3) return 1;

  // Syllable regex heuristics
  let count = 0;
  const vowels = 'aeiouy';
  let prevIsVowel = false;

  for (let i = 0; i < cleanWord.length; i++) {
    const isVowel = vowels.includes(cleanWord[i]);
    if (isVowel && !prevIsVowel) {
      count++;
    }
    prevIsVowel = isVowel;
  }

  // Adjust for silent 'e' at end
  if (cleanWord.endsWith('e') && !cleanWord.endsWith('le') && count > 1) {
    count--;
  }
  // Adjust for 'ed' endings
  if (cleanWord.endsWith('ed') && count > 1 && !cleanWord.endsWith('ted') && !cleanWord.endsWith('ded')) {
    count--;
  }

  return Math.max(1, count);
}

export function calculateReadability(text: string, words: string[], sentences: string[]) {
  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const characterCount = text.replace(/\s+/g, '').length;

  if (wordCount === 0) {
    return {
      readingEase: 100,
      fleschKincaidGrade: 0,
      ari: 0,
      gunningFog: 0,
      lexicalDensity: 0,
      averageSyllablesPerWord: 0,
    };
  }

  let totalSyllables = 0;
  let complexWordCount = 0; // Words with 3+ syllables

  for (const word of words) {
    const syllables = countSyllables(word);
    totalSyllables += syllables;
    if (syllables >= 3) {
      complexWordCount++;
    }
  }

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllablesPerWord = totalSyllables / wordCount;

  // Flesch Reading Ease: 206.835 - (1.015 * ASL) - (84.6 * ASW)
  const rawEase = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  const readingEase = Math.min(100, Math.max(0, Math.round(rawEase * 10) / 10));

  // Flesch-Kincaid Grade Level: (0.39 * ASL) + (11.8 * ASW) - 15.59
  const rawFKGL = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
  const fleschKincaidGrade = Math.max(0, Math.round(rawFKGL * 10) / 10);

  // Automated Readability Index (ARI): 4.71 * (characters / words) + 0.5 * (words / sentences) - 21.43
  const rawARI = 4.71 * (characterCount / wordCount) + 0.5 * avgWordsPerSentence - 21.43;
  const ari = Math.max(0, Math.round(rawARI * 10) / 10);

  // Gunning Fog Index: 0.4 * ((words / sentences) + 100 * (complex words / words))
  const rawFog = 0.4 * (avgWordsPerSentence + (100 * (complexWordCount / wordCount)));
  const gunningFog = Math.max(0, Math.round(rawFog * 10) / 10);

  // Lexical Density: Content words vs total words
  // Filter out short function words
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'it', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'so', 'if',
    'as', 'can', 'will', 'do', 'does', 'did', 'not'
  ]);
  const contentWords = words.filter(w => !stopWords.has(w.toLowerCase()));
  const lexicalDensity = Math.round((contentWords.length / wordCount) * 1000) / 10;

  return {
    readingEase,
    fleschKincaidGrade,
    ari,
    gunningFog,
    lexicalDensity,
    averageSyllablesPerWord: Math.round(avgSyllablesPerWord * 100) / 100,
  };
}
