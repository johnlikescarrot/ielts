import {t, dueCards, type Locale, type Card} from './core.js';
const $ = <T extends HTMLElement>(s:string) => document.querySelector<T>(s)!;
let locale: Locale = (localStorage.getItem('locale') as Locale) || 'en'; let current: Card[] = [];
async function render(){ document.documentElement.lang=locale; $('#title').textContent=t(locale,'appName'); $('#review').textContent=t(locale,'review'); const result=await browser.runtime.sendMessage({type:'due'}) as Card[]; current=dueCards(result); $('#count').textContent=String(current.length); $('#prompt').textContent=current[0]?.front || t(locale,'empty'); }
$('#language').addEventListener('change',e=>{locale=(e.target as HTMLSelectElement).value as Locale; localStorage.setItem('locale',locale); render()}); document.querySelectorAll<HTMLButtonElement>('[data-rating]').forEach(b=>b.onclick=async()=>{if(current?.[0]){await browser.runtime.sendMessage({type:'review',card:current[0],rating:Number(b.dataset.rating)});render()}}); render();
