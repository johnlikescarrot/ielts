import type {Card,Rating,Session} from './types';
export const DAY=86_400_000;
export function normalizeTerm(value:string):string{return value.trim().replace(/\s+/g,' ').slice(0,80)}
export function createCard(term:string,context:string,source:string,now=Date.now()):Card{return{id:`${now}-${normalizeTerm(term).toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,term:normalizeTerm(term),context:context.trim().slice(0,300),source,dueAt:now,createdAt:now,interval:0,ease:2.5,repetitions:0}}
export function schedule(card:Card,rating:Rating,now=Date.now()):Card{if(rating===0)return{...card,repetitions:0,interval:1,ease:Math.max(1.3,card.ease-.2),dueAt:now+DAY};const quality=rating+2;const repetitions=card.repetitions+1;const interval=repetitions===1?1:repetitions===2?3:Math.max(1,Math.round(card.interval*card.ease));const ease=Math.max(1.3,card.ease+.1-(5-quality)*(.08+(5-quality)*.02));return{...card,repetitions,interval,ease,dueAt:now+interval*DAY}}
export function dueCards(cards:Card[],now=Date.now()):Card[]{return cards.filter(c=>c.dueAt<=now).sort((a,b)=>a.dueAt-b.dueAt)}
export function studyMinutes(sessions:Session[]):number{return sessions.reduce((sum,s)=>sum+s.minutes,0)}
export function todayKey(date=new Date()):string{return date.toISOString().slice(0,10)}
export function upsertSession(sessions:Session[],minutes:number,words:number,date=todayKey()):Session[]{const found=sessions.find(s=>s.date===date);return found?sessions.map(s=>s.date===date?{...s,minutes:s.minutes+minutes,words:s.words+words}:s):[...sessions,{date,minutes,words}]}
