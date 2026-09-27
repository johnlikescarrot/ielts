export type Locale = 'en' | 'vi';
export type Card = {
    id: string;
    front: string;
    back: string;
    due: number;
    interval: number;
    ease: number;
    reps: number;
};
export declare const translations: Record<Locale, Record<string, string>>;
export declare function t(locale: Locale, key: string): string;
export declare function nextReview(card: Card, rating: 0 | 1 | 2 | 3, now?: number): Card;
export declare function dueCards(cards: Card[], now?: number): Card[];
export declare function normalizeAnswer(value: string): string;
