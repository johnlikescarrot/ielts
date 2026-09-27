import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true}); await mkdir('dist',{recursive:true});
for (const file of ['manifest.json','popup.html','popup.css','popup.js','background.js','icon.svg']) await cp(file,`dist/${file}`);
for (const locale of ['en','vi']) { await mkdir(`dist/_locales/${locale}`,{recursive:true}); await cp(`_locales/${locale}/messages.json`,`dist/_locales/${locale}/messages.json`); }
