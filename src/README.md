# IELTS Sprint source

`core.ts` is deliberately framework-free and deterministic so the learning scheduler can be tested exhaustively. The browser UI is a small MV3 popup; data stays in `browser.storage.local` and never leaves Firefox.