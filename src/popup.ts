import { copy, dueCards, schedule, type Card, type Language, type Rating } from './core.js';
const api = globalThis.browser;
const app = document.querySelector<HTMLElement>('#app')!;
let language: Language = 'en';
let cards: Card[] = [];
const text = () => copy[language];
async function load(): Promise<void> { const data = await api.storage.local.get(['cards', 'language']); cards = (data.cards as Card[] | undefined) ?? []; language = (data.language as Language | undefined) ?? 'en'; render(); }
async function save(): Promise<void> { await api.storage.local.set({ cards, language }); }
function render(): void { const due = dueCards(cards); app.innerHTML = `<header><div class="mark">IS</div><div><h1>${text().title}</h1><p>${text().tagline}</p></div><button id="lang" title="${text().language}">${language === 'en' ? 'VI' : 'EN'}</button></header><section class="stats"><div><strong>${cards.length}</strong><span>${text().saved}</span></div><div><strong>${due.length}</strong><span>${text().due}</span></div></section><section class="card">${due.length ? `<div class="eyebrow">${text().review}</div><h2>${escapeHtml(due[0].word)}</h2><p class="context">${escapeHtml(due[0].context || text().capture)}</p><div class="ratings"><button data-rate="1">1 · ${text().forget}</button><button data-rate="2">2 · ${text().hard}</button><button data-rate="3">3 · ${text().good}</button><button data-rate="4">4 · ${text().easy}</button></div>` : `<div class="empty">${text().empty}</div>`}</section><footer>${text().privacy}</footer>`; document.querySelector('#lang')?.addEventListener('click', () => { language = language === 'en' ? 'vi' : 'en'; void save().then(render); }); document.querySelectorAll<HTMLButtonElement>('[data-rate]').forEach((button) => button.addEventListener('click', () => { const current = due[0]; if (!current) return; cards = cards.map((card) => card.id === current.id ? schedule(card, Number(button.dataset.rate) as Rating) : card); void save().then(render); })); }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char)); }
void load();
