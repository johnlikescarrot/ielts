export type Language = 'en' | 'vi';
export type Rating = 1 | 2 | 3 | 4;
export interface Card { id: string; word: string; context: string; createdAt: number; dueAt: number; interval: number; ease: number; reviews: number; }
export const DAY = 86_400_000;
export const copy = {
  en: { title: 'IELTS Sprint', tagline: 'Small practice. Real progress.', saved: 'Saved words', due: 'Due today', empty: 'No words yet. Select a word on any page to save it.', review: 'Review now', capture: 'Select a word on a page', language: 'Language', privacy: 'Private by design · no account · no tracking', mastered: 'Mastered', forget: 'Forgot', hard: 'Hard', good: 'Good', easy: 'Easy' },
  vi: { title: 'IELTS Sprint', tagline: 'Luyện ít. Tiến bộ thật.', saved: 'Từ đã lưu', due: 'Cần ôn hôm nay', empty: 'Chưa có từ nào. Hãy chọn một từ trên bất kỳ trang nào để lưu.', review: 'Ôn ngay', capture: 'Chọn một từ trên trang', language: 'Ngôn ngữ', privacy: 'Riêng tư · không tài khoản · không theo dõi', mastered: 'Đã thuộc', forget: 'Quên', hard: 'Khó', good: 'Tốt', easy: 'Dễ' }
} as const;
export function normalizeWord(value: string): string { return value.trim().toLowerCase().replace(/[^a-z'-]/g, ''); }
export function makeCard(word: string, context = '', now = Date.now()): Card { const clean = normalizeWord(word); return { id: `${clean}-${now}`, word: clean, context: context.trim().slice(0, 240), createdAt: now, dueAt: now, interval: 0, ease: 2.5, reviews: 0 }; }
export function isDue(card: Card, now = Date.now()): boolean { return card.dueAt <= now; }
export function schedule(card: Card, rating: Rating, now = Date.now()): Card {
  const multipliers: Record<Rating, number> = { 1: 0, 2: 1.2, 3: card.ease, 4: card.ease + 0.65 };
  const interval = rating === 1 ? 0 : Math.max(1, Math.round(Math.max(card.interval, 1) * multipliers[rating]));
  const ease = Math.min(3.2, Math.max(1.3, card.ease + (rating === 1 ? -0.2 : rating === 4 ? 0.15 : rating === 2 ? -0.1 : 0)));
  return { ...card, interval, ease, reviews: card.reviews + 1, dueAt: now + interval * DAY };
}
export function dueCards(cards: Card[], now = Date.now()): Card[] { return cards.filter((card) => isDue(card, now)).sort((a, b) => a.dueAt - b.dueAt); }
export function selectionToWord(selection: string): string { return normalizeWord(selection.split(/\s+/)[0]); }
