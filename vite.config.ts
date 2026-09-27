import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],base:'./',server:{allowedHosts:true},build:{rollupOptions:{input:{app:'index.html',popup:'popup.html'}}},test:{environment:'jsdom',coverage:{provider:'v8',reporter:['text','html'],include:['src/lib/**/*.ts'],thresholds:{lines:100,functions:100,branches:100,statements:100}}}});
