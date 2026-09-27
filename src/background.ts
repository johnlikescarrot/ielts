import { dueCards, type Card } from './core.js';
const defaults: Card[] = [];
async function cards(): Promise<Card[]> { const result = await browser.storage.local.get({cards: defaults}); return result.cards as Card[]; }
browser.runtime.onMessage.addListener(async (message: {type:string; card?:Card; rating?:0|1|2|3}) => {
  const all = await cards();
  if (message.type === 'due') return dueCards(all);
  if (message.type === 'save' && message.card) { const index=all.findIndex(c=>c.id===message.card!.id); index<0 ? all.push(message.card) : all[index]=message.card; await browser.storage.local.set({cards:all}); return message.card; }
  if (message.type === 'review' && message.card && message.rating !== undefined) { const {nextReview}=await import('./core.js'); const updated=nextReview(message.card,message.rating); const index=all.findIndex(c=>c.id===updated.id); if(index>=0) all[index]=updated; await browser.storage.local.set({cards:all}); return updated; }
  return null;
});
