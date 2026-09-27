import type { CaptureInput } from './types';

export const STARTER_CARDS: readonly CaptureInput[] = [
  {
    prompt: 'a compelling argument',
    answer: 'a persuasive line of reasoning supported by relevant evidence',
    context: 'The writer presents a compelling argument for investing in public transport.',
    skill: 'reading',
  },
  {
    prompt: 'to a large extent',
    answer: 'mostly, but not completely; useful for a nuanced IELTS position',
    context: 'I agree with this view to a large extent, although cost remains a concern.',
    skill: 'writing',
  },
  {
    prompt: 'Could you elaborate on that?',
    answer: 'a natural request for more detail or explanation',
    context: 'Could you elaborate on that and give me an example?',
    skill: 'listening',
  },
  {
    prompt: 'One experience that stands out is…',
    answer: 'a fluent signpost for beginning an IELTS Speaking Part 2 story',
    context: 'One experience that stands out is my first solo journey abroad.',
    skill: 'speaking',
  },
];
