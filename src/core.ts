export type Skill = 'reading' | 'listening' | 'writing' | 'speaking';
export interface Session { skill: Skill; minutes: number; date: string }
export const skills: readonly Skill[] = ['reading', 'listening', 'writing', 'speaking'];
export const dailyGoal = 25;
export function todayKey(date = new Date()): string { return date.toISOString().slice(0, 10); }
export function totalMinutes(sessions: readonly Session[], day = todayKey()): number { return sessions.filter(s => s.date === day).reduce((sum, s) => sum + s.minutes, 0); }
export function progress(sessions: readonly Session[], day = todayKey()): number { return Math.min(100, Math.round(totalMinutes(sessions, day) / dailyGoal * 100)); }
export function randomPrompt(skill: Skill, random = Math.random): string {
 const prompts: Record<Skill, string[]> = {
  reading: ['Find the author’s main claim in a news article.', 'Skim a page and write three keywords.'],
  listening: ['Listen to a short podcast and note five details.', 'Shadow one minute of natural English.'],
  writing: ['Write a thesis and two supporting ideas in five minutes.', 'Paraphrase a question without changing its meaning.'],
  speaking: ['Describe a memorable place for two minutes.', 'Give an opinion, then support it with an example.']
 };
 return prompts[skill][Math.floor(random() * prompts[skill].length)];
}
