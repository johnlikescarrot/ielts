export const translations = {
    en: { appName: 'IELTS Slayer', review: 'Review', listening: 'Listening', speaking: 'Speaking', vocabulary: 'Vocabulary', settings: 'Settings', newCard: 'New card', again: 'Again', hard: 'Hard', good: 'Good', easy: 'Easy', empty: 'No cards due. Great work!' },
    vi: { appName: 'IELTS Slayer', review: 'Ôn tập', listening: 'Nghe', speaking: 'Nói', vocabulary: 'Từ vựng', settings: 'Cài đặt', newCard: 'Thẻ mới', again: 'Lại', hard: 'Khó', good: 'Tốt', easy: 'Dễ', empty: 'Không có thẻ cần ôn. Làm tốt lắm!' }
};
export function t(locale, key) { return translations[locale][key] ?? translations.en[key] ?? key; }
export function nextReview(card, rating, now = Date.now()) {
    const factors = [0.25, 0.75, 1.5, 2.5];
    const interval = Math.max(1, Math.round(card.interval * factors[rating] || factors[rating]));
    return { ...card, interval, ease: Math.max(1.3, card.ease + (rating === 3 ? 0.15 : rating === 0 ? -0.2 : 0)), reps: card.reps + 1, due: now + interval * 86400000 };
}
export function dueCards(cards, now = Date.now()) { return cards.filter(c => c.due <= now).sort((a, b) => a.due - b.due); }
export function normalizeAnswer(value) { return value.trim().toLocaleLowerCase().replace(/[^a-z0-9\s']/g, '').replace(/\s+/g, ' '); }
