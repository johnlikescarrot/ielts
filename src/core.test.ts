import test from 'node:test'; import assert from 'node:assert/strict'; import {t,nextReview,dueCards,normalizeAnswer} from './core.ts';
test('English is default and Vietnamese is available',()=>{assert.equal(t('en','appName'),'IELTS Slayer');assert.equal(t('vi','review'),'Ôn tập')});
test('unknown translation falls back',()=>assert.equal(t('vi','missing'),'missing'));
test('scheduling changes due date and protects ease',()=>{const c={id:'1',front:'a',back:'b',due:0,interval:1,ease:1.3,reps:0};const n=nextReview(c,0,100);assert.equal(n.reps,1);assert.ok(n.due>100);assert.ok(n.ease>=1.3)});
test('due cards sorted',()=>{const c=(due:number)=>({id:String(due),front:'',back:'',due,interval:1,ease:2.5,reps:0});assert.deepEqual(dueCards([c(3),c(1),c(9)],4).map(x=>x.id),['1','3'])});
test('answer normalization',()=>assert.equal(normalizeAnswer("  Hello,   WORLD! "),'hello world'));
