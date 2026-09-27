import {cp, mkdir} from 'node:fs/promises';
await mkdir('dist',{recursive:true}); await Promise.all([cp('src/background.js','dist/background.js'),cp('src/content.js','dist/content.js')]);
