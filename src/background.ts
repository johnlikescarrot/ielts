import { makeCard, type Card } from './core.js';
const api = globalThis.browser;
api.runtime.onMessage.addListener(async (message: { type: string; word?: string; context?: string }) => {
  if (message.type !== 'save-word' || !message.word) return undefined;
  const data = await api.storage.local.get('cards');
  const cards = (data.cards as Card[] | undefined) ?? [];
  const word = message.word.trim().toLowerCase();
  if (!word || cards.some((card) => card.word === word)) return { ok: true, duplicate: true };
  const card = makeCard(word, message.context);
  await api.storage.local.set({ cards: [...cards, card] });
  return { ok: true, card };
});
