import { ACADEMIC_WORD_LIST } from '../ast/awlList';
import { INITIAL_VOCABULARY } from '../data/vocabularyBank';
import { SubtitleCue, parseSrtOrVtt } from './subtitleParser';
import { cefrToBand, VideoVocabulary } from './videoLesson';

const VOCAB_MAP = new Map(INITIAL_VOCABULARY.map(v => [v.word.toLowerCase(), v]));

export type ChunkingMode = 'cue' | 'fixed' | 'sentence';
export type SubtitlesVisibilityMode = 'full' | 'blur' | 'keywords' | 'hidden';

export const PLAYBACK_SPEEDS = [0.5, 0.75, 0.85, 1.0, 1.25, 1.5, 1.75, 2.0] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export interface ShadowingChunk {
  id: string;
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
  vocabulary: VideoVocabulary[];
  repetitionCount: number;
  targetRepetitions: number;
  recordedAudioUrl?: string;
}

export interface ShadowingSession {
  id: string;
  title: string;
  sourceType: 'youtube' | 'local' | 'preset';
  sourceUrl?: string;
  durationSeconds: number;
  chunks: ShadowingChunk[];
  activeChunkIndex: number;
  playbackSpeed: number;
  autoAdvance: boolean;
  autoAdvanceDelaySeconds: number;
  subtitlesMode: SubtitlesVisibilityMode;
  targetRepetitionsPerChunk: number;
}

function getWordCandidates(word: string): string[] {
  const candidates = [word];
  if (word.endsWith('s') && !word.endsWith('ss')) candidates.push(word.slice(0, -1));
  if (word.endsWith('es')) candidates.push(word.slice(0, -2));
  if (word.endsWith('ed')) candidates.push(word.slice(0, -2), word.slice(0, -1));
  if (word.endsWith('ing')) candidates.push(word.slice(0, -3), `${word.slice(0, -3)}e`);
  if (word.endsWith('ly')) candidates.push(word.slice(0, -2));
  if (word.endsWith('tion')) candidates.push(`${word.slice(0, -4)}te`, `${word.slice(0, -4)}t`, word.slice(0, -4));
  if (word.endsWith('ic')) candidates.push(`${word.slice(0, -2)}y`, word.slice(0, -2));
  if (word.endsWith('ment')) candidates.push(word.slice(0, -4));
  return candidates;
}

export function extractChunkVocabulary(text: string): VideoVocabulary[] {
  const words = text.toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g) ?? [];
  const vocabulary: VideoVocabulary[] = [];
  const seen = new Set<string>();

  for (const rawWord of words) {
    if (seen.has(rawWord) || rawWord.length < 3) continue;

    const candidateList = getWordCandidates(rawWord);
    let matched = false;

    for (const candidate of candidateList) {
      const bankEntry = VOCAB_MAP.get(candidate);
      if (bankEntry && !seen.has(bankEntry.word.toLowerCase())) {
        seen.add(rawWord);
        seen.add(bankEntry.word.toLowerCase());
        vocabulary.push({
          word: bankEntry.word,
          definitionEn: bankEntry.definitionEn,
          definitionVi: bankEntry.definitionVi,
          cefr: bankEntry.cefrLevel,
          band: bankEntry.bandScore,
        });
        matched = true;
        break;
      }

      const academicEntry = ACADEMIC_WORD_LIST[candidate];
      if (academicEntry && !seen.has(candidate)) {
        seen.add(rawWord);
        seen.add(candidate);
        vocabulary.push({
          word: candidate,
          definitionEn: academicEntry.definition,
          definitionVi: academicEntry.definitionVi,
          cefr: academicEntry.cefr,
          band: cefrToBand(academicEntry.cefr),
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      seen.add(rawWord);
    }
  }

  return vocabulary;
}

export function createShadowingChunks(
  cues: SubtitleCue[],
  mode: ChunkingMode = 'cue',
  fixedDuration = 8,
  targetRepetitions = 3,
): ShadowingChunk[] {
  if (cues.length === 0) return [];

  const safeTargetReps = Math.max(1, targetRepetitions);

  if (mode === 'cue') {
    return cues.map((cue, index) => ({
      id: `chunk-${index + 1}`,
      index,
      startSeconds: cue.startSeconds,
      endSeconds: cue.endSeconds,
      text: cue.text,
      vocabulary: extractChunkVocabulary(cue.text),
      repetitionCount: 0,
      targetRepetitions: safeTargetReps,
    }));
  }

  if (mode === 'sentence') {
    const sentenceChunks: ShadowingChunk[] = [];
    let currentStart: number | null = null;
    let currentEnd = 0;
    let accumulatedText: string[] = [];

    for (let i = 0; i < cues.length; i++) {
      const cue = cues[i];
      if (currentStart === null) currentStart = cue.startSeconds;
      currentEnd = cue.endSeconds;
      accumulatedText.push(cue.text);

      const isSentenceEnd = /[.?!]$/.test(cue.text.trim()) || i === cues.length - 1;
      if (isSentenceEnd) {
        const fullText = accumulatedText.join(' ');
        const index = sentenceChunks.length;
        sentenceChunks.push({
          id: `chunk-${index + 1}`,
          index,
          startSeconds: currentStart,
          endSeconds: currentEnd,
          text: fullText,
          vocabulary: extractChunkVocabulary(fullText),
          repetitionCount: 0,
          targetRepetitions: safeTargetReps,
        });
        currentStart = null;
        accumulatedText = [];
      }
    }

    return sentenceChunks;
  }

  // Fixed duration chunking
  const totalDuration = cues[cues.length - 1].endSeconds;
  const safeFixedDuration = Math.max(3, Math.min(120, fixedDuration));
  const chunkCount = Math.max(1, Math.ceil(totalDuration / safeFixedDuration));
  const fixedChunks: ShadowingChunk[] = [];

  for (let index = 0; index < chunkCount; index++) {
    const startSeconds = index * safeFixedDuration;
    const endSeconds = Math.min(totalDuration, (index + 1) * safeFixedDuration);

    // Find all cues that overlap this window
    const overlappingCues = cues.filter(
      c => (c.startSeconds >= startSeconds && c.startSeconds < endSeconds) ||
           (c.endSeconds > startSeconds && c.endSeconds <= endSeconds) ||
           (c.startSeconds <= startSeconds && c.endSeconds >= endSeconds)
    );

    const chunkText = overlappingCues.map(c => c.text).join(' ').trim() || `Segment ${index + 1}`;

    fixedChunks.push({
      id: `chunk-${index + 1}`,
      index,
      startSeconds,
      endSeconds: Math.max(endSeconds, startSeconds + 1),
      text: chunkText,
      vocabulary: extractChunkVocabulary(chunkText),
      repetitionCount: 0,
      targetRepetitions: safeTargetReps,
    });
  }

  return fixedChunks;
}

export function cyclePlaybackSpeed(currentSpeed: number): PlaybackSpeed {
  const currentIndex = PLAYBACK_SPEEDS.indexOf(currentSpeed as PlaybackSpeed);
  if (currentIndex === -1) return 1.0;
  const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
  return PLAYBACK_SPEEDS[nextIndex];
}

export interface CreateShadowingSessionOptions {
  title: string;
  sourceType: 'youtube' | 'local' | 'preset';
  sourceUrl?: string;
  transcriptOrSubtitles: string;
  mode?: ChunkingMode;
  fixedDurationSeconds?: number;
  targetRepetitions?: number;
  autoAdvance?: boolean;
  autoAdvanceDelaySeconds?: number;
}

export function createShadowingSession(options: CreateShadowingSessionOptions): ShadowingSession {
  const cues = parseSrtOrVtt(options.transcriptOrSubtitles);
  const chunks = createShadowingChunks(
    cues,
    options.mode ?? 'cue',
    options.fixedDurationSeconds ?? 8,
    options.targetRepetitions ?? 3,
  );

  const durationSeconds = cues.length > 0 ? cues[cues.length - 1].endSeconds : 0;

  return {
    id: `shadow-sess-${Date.now()}`,
    title: options.title || 'IELTS Shadowing Session',
    sourceType: options.sourceType,
    sourceUrl: options.sourceUrl,
    durationSeconds,
    chunks,
    activeChunkIndex: 0,
    playbackSpeed: 1.0,
    autoAdvance: options.autoAdvance ?? true,
    autoAdvanceDelaySeconds: options.autoAdvanceDelaySeconds ?? 3,
    subtitlesMode: 'full',
    targetRepetitionsPerChunk: options.targetRepetitions ?? 3,
  };
}

export function nextChunk(session: ShadowingSession): ShadowingSession {
  if (session.chunks.length === 0) return session;
  const nextIndex = Math.min(session.chunks.length - 1, session.activeChunkIndex + 1);
  return {
    ...session,
    activeChunkIndex: nextIndex,
  };
}

export function prevChunk(session: ShadowingSession): ShadowingSession {
  if (session.chunks.length === 0) return session;
  const prevIndex = Math.max(0, session.activeChunkIndex - 1);
  return {
    ...session,
    activeChunkIndex: prevIndex,
  };
}

export function goToChunk(session: ShadowingSession, index: number): ShadowingSession {
  if (session.chunks.length === 0) return session;
  const safeIndex = Math.max(0, Math.min(session.chunks.length - 1, index));
  return {
    ...session,
    activeChunkIndex: safeIndex,
  };
}

export function incrementRepetition(session: ShadowingSession, chunkIndex?: number): ShadowingSession {
  const targetIndex = chunkIndex ?? session.activeChunkIndex;
  if (targetIndex < 0 || targetIndex >= session.chunks.length) return session;

  const updatedChunks = session.chunks.map((chunk, idx) => {
    if (idx === targetIndex) {
      return {
        ...chunk,
        repetitionCount: chunk.repetitionCount + 1,
      };
    }
    return chunk;
  });

  return {
    ...session,
    chunks: updatedChunks,
  };
}

export function attachChunkRecording(
  session: ShadowingSession,
  chunkIndex: number,
  recordingUrl: string,
): ShadowingSession {
  if (chunkIndex < 0 || chunkIndex >= session.chunks.length) return session;

  const updatedChunks = session.chunks.map((chunk, idx) => {
    if (idx === chunkIndex) {
      return {
        ...chunk,
        recordedAudioUrl: recordingUrl,
      };
    }
    return chunk;
  });

  return {
    ...session,
    chunks: updatedChunks,
  };
}

export function calculateShadowingMastery(session: ShadowingSession): {
  masteredChunks: number;
  totalChunks: number;
  totalRepetitions: number;
  masteryPercentage: number;
} {
  const totalChunks = session.chunks.length;
  if (totalChunks === 0) {
    return { masteredChunks: 0, totalChunks: 0, totalRepetitions: 0, masteryPercentage: 0 };
  }

  let totalRepetitions = 0;
  let masteredChunks = 0;

  for (const chunk of session.chunks) {
    totalRepetitions += chunk.repetitionCount;
    if (chunk.repetitionCount >= chunk.targetRepetitions) {
      masteredChunks++;
    }
  }

  const masteryPercentage = Math.round((masteredChunks / totalChunks) * 100);

  return {
    masteredChunks,
    totalChunks,
    totalRepetitions,
    masteryPercentage,
  };
}
