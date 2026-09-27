export type Language = "en" | "vi";
export type Rating = 1 | 2 | 3 | 4;
export type Skill = "reading" | "listening" | "writing" | "speaking";

export interface Card {
  id: string;
  front: string;
  back: string;
  context: string;
  due: string;
  interval: number;
  ease: number;
  reviews: number;
}

export interface Progress {
  streak: number;
  reviewed: number;
  minutes: number;
  skillMinutes: Record<Skill, number>;
}

export interface AppData {
  cards: Card[];
  progress: Progress;
  language: Language;
}

export const initialData: AppData = {
  language: "en",
  cards: [
    {
      id: "nuance",
      front: "nuance",
      back: "a subtle difference in meaning or expression",
      context: "A strong response captures the nuance of the argument.",
      due: "2000-01-01",
      interval: 0,
      ease: 2.5,
      reviews: 0,
    },
    {
      id: "coherent",
      front: "coherent",
      back: "logical, consistent and easy to understand",
      context: "Develop a coherent position throughout your essay.",
      due: "2000-01-01",
      interval: 0,
      ease: 2.5,
      reviews: 0,
    },
    {
      id: "prevalent",
      front: "prevalent",
      back: "widespread in a particular area or time",
      context: "Remote work has become increasingly prevalent.",
      due: "2000-01-01",
      interval: 0,
      ease: 2.5,
      reviews: 0,
    },
  ],
  progress: {
    streak: 1,
    reviewed: 0,
    minutes: 0,
    skillMinutes: { reading: 0, listening: 0, writing: 0, speaking: 0 },
  },
};

export function dueCards(cards: Card[], now: Date): Card[] {
  const time = now.getTime();
  return cards
    .filter((card) => new Date(card.due).getTime() <= time)
    .sort((a, b) => a.due.localeCompare(b.due));
}

export function schedule(card: Card, rating: Rating, now: Date): Card {
  const lapse = rating === 1;
  const interval = lapse
    ? 1
    : card.reviews === 0
      ? rating - 1
      : Math.max(
          1,
          Math.round(
            card.interval *
              (rating === 2 ? 1.2 : rating === 3 ? card.ease : card.ease * 1.5),
          ),
        );
  const ease = Math.min(
    3,
    Math.max(
      1.3,
      card.ease + ({ 1: -0.2, 2: -0.05, 3: 0, 4: 0.15 } as const)[rating],
    ),
  );
  const due = new Date(now);
  due.setUTCDate(due.getUTCDate() + interval);
  return {
    ...card,
    due: due.toISOString(),
    interval,
    ease,
    reviews: card.reviews + 1,
  };
}

export function addCard(cards: Card[], front: string, context = ""): Card[] {
  const word = front.trim().replace(/\s+/g, " ");
  if (
    !word ||
    cards.some(
      (card) => card.front.toLocaleLowerCase() === word.toLocaleLowerCase(),
    )
  )
    return cards;
  return [
    {
      id: `${word.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}-${cards.length}`,
      front: word,
      back: "",
      context: context.trim(),
      due: new Date(0).toISOString(),
      interval: 0,
      ease: 2.5,
      reviews: 0,
    },
    ...cards,
  ];
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/u).length : 0;
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
