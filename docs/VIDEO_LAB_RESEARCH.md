# Video Practice Lab Research Notes

Date: 2026-09-27

## Source repository reviewed

- `https://github.com/Libailin222/ielts-video-assistant`
  - Public template described as an AI-powered IELTS learning tool for YouTube and Bilibili videos.
  - Core learner workflow: paste a Bilibili/YouTube link, analyze captions/subtitles, and generate IELTS Reading, Listening, Speaking, Writing, and dictionary tasks.
  - Notable UX ideas: timestamp-linked Listening fill-in-the-blank tasks, video-derived Reading matching / True-False-Not-Given, Speaking Part 3 flashcards, Task 2 writing ideas, and double-click dictionary lookup.
  - Adoption snapshot at review time: 4 GitHub stars, 0 forks, 23 commits, bilingual README.

## Product decision for this Firefox extension

IELTS Slayer should keep its stronger privacy promise: free, offline-capable, no account, no paid API key, and no server. Instead of sending captions to an external AI service, the new Video Practice Lab transforms pasted captions locally with deterministic TypeScript heuristics:

1. Normalize pasted transcripts with or without timestamps.
2. Detect YouTube, Bilibili, or generic video URLs.
3. Parse text through the existing AST engine to estimate words, sentences, academic-word density, and topics.
4. Generate timestamped Listening gap-fill drills.
5. Generate Reading True / False / Not Given drills.
6. Generate Speaking Part 1, Part 2, and Part 3 prompts.
7. Generate a Writing Task 2 discussion prompt with planning angles.
8. Extract Band 7–9 vocabulary and save it into local SRS flashcards.
9. Export the whole generated practice pack as local JSON.

## facebook/astryx usage

- Source: `https://github.com/facebook/astryx`
- CLI command used during implementation: `npx --yes @astryxdesign/cli@0.6.3 docs principles --detail compact`
- Applied principles:
  - Frame-first page layout.
  - Controlled form inputs.
  - Dense educational data rendered as rows/sections.
  - Semantic Tailwind utility usage instead of inline hard-coded styles.

## Quality evidence added

- Pure generator tests: platform detection, timestamp parsing, transcript normalization, segment extraction, vocabulary extraction, full pack generation, and empty-input fallback.
- UI integration tests: Video Lab form editing, sample load, generation, explanation reveal, JSON export, and SRS vocabulary saving.
- Broader reliability improvements: TypeScript recognition for jest-dom matchers, localStorage/browser-storage edge coverage, and jsdom-safe test setup for downloads/navigation.
