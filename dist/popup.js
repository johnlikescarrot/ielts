import { t, dueCards } from './core.js';
const $ = (s) => document.querySelector(s);
let locale = localStorage.getItem('locale') || 'en';
let current = [];
async function render() { document.documentElement.lang = locale; $('#title').textContent = t(locale, 'appName'); $('#review').textContent = t(locale, 'review'); const result = await browser.runtime.sendMessage({ type: 'due' }); current = dueCards(result); $('#count').textContent = String(current.length); $('#prompt').textContent = current[0]?.front || t(locale, 'empty'); }
$('#language').addEventListener('change', e => { locale = e.target.value; localStorage.setItem('locale', locale); render(); });
document.querySelectorAll('[data-rating]').forEach(b => b.onclick = async () => { if (current?.[0]) {
    await browser.runtime.sendMessage({ type: 'review', card: current[0], rating: Number(b.dataset.rating) });
    render();
} });
render();
