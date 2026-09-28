import { tokenizeSentence } from './src/ast/astParser';

const sentence = "Furthermore, because of the fact that it is a beautiful day, we should go outside, and moreover, we should enjoy it, nevertheless, we must finish our work, even though it is hard.";

const longSentence = Array(1000).fill(sentence).join(' ');

console.time('tokenizeSentence (Optimized)');
for (let i = 0; i < 100; i++) {
  tokenizeSentence(longSentence, 0);
}
console.timeEnd('tokenizeSentence (Optimized)');
