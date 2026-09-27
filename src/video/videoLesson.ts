import { ACADEMIC_WORD_LIST } from "../ast/awlList";

export interface VideoLesson {
  title: string;
  wordCount: number;
  estimatedMinutes: number;
  cloze: Array<{ sentence: string; answer: string }>;
  vocabulary: string[];
  speakingPrompts: string[];
  writingPrompt: string;
}

const WORD = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g;
const SENTENCE = /[^.!?]+[.!?]+|[^.!?]+$/g;

export function cleanTranscript(input: string): string {
  return input
    .replace(
      /^\s*(?:\[?\d{1,2}:\d{2}(?::\d{2})?\]?|\d+\s*-->\s*\d+)[\s:-]*/gm,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function createVideoLesson(
  input: string,
  title = "My video lesson",
): VideoLesson {
  const transcript = cleanTranscript(input);
  const words = transcript.match(WORD) ?? [];
  if (words.length < 40) {
    throw new Error("Transcript must contain at least 40 English words.");
  }

  const sentences = transcript.match(SENTENCE)!.map((value) => value.trim());
  const academic = new Set(Object.keys(ACADEMIC_WORD_LIST));
  const frequencies = new Map<string, number>();
  words.forEach((word) => {
    const normalized = word.toLowerCase();
    if (normalized.length >= 6)
      frequencies.set(normalized, (frequencies.get(normalized) ?? 0) + 1);
  });

  const candidates = [...frequencies]
    .sort(
      ([a, aCount], [b, bCount]) =>
        Number(academic.has(b)) - Number(academic.has(a)) ||
        bCount - aCount ||
        a.localeCompare(b),
    )
    .map(([word]) => word);
  const vocabulary = candidates.slice(0, 8);
  const cloze = vocabulary.slice(0, 5).flatMap((answer) => {
    const sentence = sentences.find((value) =>
      new RegExp(`\\b${answer}\\b`, "i").test(value),
    );
    return [
      {
        sentence: sentence!.replace(
          new RegExp(`\\b${answer}\\b`, "i"),
          "________",
        ),
        answer,
      },
    ];
  });
  const topic = title.trim() || "the ideas in this video";

  return {
    title: topic,
    wordCount: words.length,
    estimatedMinutes: Math.max(1, Math.ceil(words.length / 130)),
    cloze,
    vocabulary,
    speakingPrompts: [
      `Summarise the main argument of “${topic}” in your own words.`,
      `Which idea from “${topic}” do you find most convincing, and why?`,
      `How could the ideas in “${topic}” affect your community in the future?`,
    ],
    writingPrompt: `Some people believe the ideas discussed in “${topic}” should influence public policy. To what extent do you agree or disagree?`,
  };
}
