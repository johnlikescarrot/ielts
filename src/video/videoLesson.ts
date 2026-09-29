import { ACADEMIC_WORD_LIST } from '../ast/awlList';
import { INITIAL_VOCABULARY } from '../data/vocabularyBank';

const VOCAB_MAP = new Map(INITIAL_VOCABULARY.map(v => [v.word.toLowerCase(), v]));

export interface TranscriptCue {
  id: string;
  startSeconds: number;
  endSeconds?: number;
  text: string;
  translationVi?: string;
}

export interface VideoVocabulary {
  word: string;
  definitionEn: string;
  definitionVi: string;
  cefr: string;
  band: number;
  phonetic?: string;
}

export interface ClozeQuestion {
  id: string;
  cueId: string;
  startSeconds: number;
  prompt: string;
  cueText: string;
  answer: string;
  hint: string;
}

export interface VideoLesson {
  cues: TranscriptCue[];
  questions: ClozeQuestion[];
  vocabulary: VideoVocabulary[];
  wordCount: number;
  durationSeconds: number;
  title?: string;
}

export interface PronunciationWordResult {
  word: string;
  status: 'correct' | 'missing' | 'mispronounced';
  score: number;
}

export interface PronunciationScoreResult {
  score: number;
  band: number;
  matchedWords: PronunciationWordResult[];
  feedbackEn: string;
  feedbackVi: string;
}

export interface CuratedLesson {
  id: string;
  title: string;
  category: 'speaking-part1' | 'speaking-part2' | 'speaking-part3' | 'academic-lecture';
  description: string;
  transcript: string;
  targetBand: number;
  keyWords: string[];
  durationSeconds: number;
}

const STOP_WORDS = new Set([
  'about', 'after', 'again', 'against', 'because', 'before', 'being', 'between',
  'could', 'during', 'every', 'first', 'from', 'have', 'into', 'other', 'should',
  'their', 'there', 'these', 'those', 'through', 'under', 'very', 'where', 'which',
  'while', 'with', 'would', 'your',
]);

export const MAX_TRANSCRIPT_CHARACTERS = 100_000;

const TIME_PATTERN = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/;

export function timestampToSeconds(timestamp: string): number | null {
  const match = timestamp.trim().match(TIME_PATTERN);
  if (!match) return null;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function stripAngleMarkup(text: string): string {
  let result = '';
  let insideTag = false;
  for (const character of text) {
    if (character === '<') {
      insideTag = true;
    } else if (character === '>') {
      insideTag = false;
    } else if (!insideTag) {
      result += character;
    }
  }
  return result;
}

export function cleanCaption(text: string): string {
  return stripAngleMarkup(text)
    .replace(/\{\\[^}]*}/g, '')
    .replace(/\{[^}]*}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseSRT(srtText: string): TranscriptCue[] {
  const cleaned = srtText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '').trim();
  if (!cleaned) return [];
  const blocks = cleaned.split(/\n\s*\n/);
  const cues: TranscriptCue[] = [];
  const timeRe = /(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const timeIdx = lines.findIndex(l => timeRe.test(l));
    if (timeIdx < 0) continue;
    const match = timeRe.exec(lines[timeIdx])!;
    const start = timestampToSeconds(match[1]);
    const end = timestampToSeconds(match[2]);
    if (start === null) continue;
    const rawText = lines.slice(timeIdx + 1).join(' ');
    const text = cleanCaption(rawText);
    if (text) {
      cues.push({
        id: `cue-${cues.length + 1}`,
        startSeconds: start,
        endSeconds: end !== null ? end : undefined,
        text,
      });
    }
  }
  return cues;
}

export function parseVTT(vttText: string): TranscriptCue[] {
  const cleaned = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/^\uFEFF/, '').replace(/^WEBVTT[^\n]*\n+/i, '').trim();
  if (!cleaned) return [];
  const blocks = cleaned.split(/\n\s*\n/);
  const cues: TranscriptCue[] = [];
  const timeRe = /((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})\s*-->\s*((?:\d{1,2}:)?\d{2}:\d{2}[,.]\d{1,3})/;

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    const timeIdx = lines.findIndex(l => timeRe.test(l));
    if (timeIdx < 0) continue;
    const match = timeRe.exec(lines[timeIdx])!;
    const start = timestampToSeconds(match[1]);
    const end = timestampToSeconds(match[2]);
    if (start === null) continue;
    const rawText = lines.slice(timeIdx + 1).join(' ');
    const text = cleanCaption(rawText);
    if (text) {
      cues.push({
        id: `cue-${cues.length + 1}`,
        startSeconds: start,
        endSeconds: end !== null ? end : undefined,
        text,
      });
    }
  }
  return cues;
}

export function exportToSRT(cues: TranscriptCue[]): string {
  const formatSrtTime = (sec: number): string => {
    const safeSec = Math.max(0, sec);
    const hrs = Math.floor(safeSec / 3600);
    const mins = Math.floor((safeSec % 3600) / 60);
    const s = Math.floor(safeSec % 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')},000`;
  };

  return cues.map((cue, index) => {
    const start = formatSrtTime(cue.startSeconds);
    const endSec = cue.endSeconds ?? (cue.startSeconds + 4);
    const end = formatSrtTime(endSec);
    return `${index + 1}\n${start} --> ${end}\n${cue.text}\n`;
  }).join('\n');
}

export function exportToVTT(cues: TranscriptCue[]): string {
  const formatVttTime = (sec: number): string => {
    const safeSec = Math.max(0, sec);
    const hrs = Math.floor(safeSec / 3600);
    const mins = Math.floor((safeSec % 3600) / 60);
    const s = Math.floor(safeSec % 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}.000`;
  };

  const body = cues.map((cue, index) => {
    const start = formatVttTime(cue.startSeconds);
    const endSec = cue.endSeconds ?? (cue.startSeconds + 4);
    const end = formatVttTime(endSec);
    return `${index + 1}\n${start} --> ${end}\n${cue.text}\n`;
  }).join('\n');

  return `WEBVTT\n\n${body}`;
}

export function parseTranscript(input: string): TranscriptCue[] {
  const lines = input.slice(0, MAX_TRANSCRIPT_CHARACTERS).replace(/\r/g, '').split('\n');
  const cues: TranscriptCue[] = [];
  let pendingTime: number | null = null;

  const addCue = (startSeconds: number, rawText: string) => {
    const text = cleanCaption(rawText);
    if (!text) return;
    const previous = cues[cues.length - 1];
    if (previous && previous.startSeconds === startSeconds) {
      previous.text = `${previous.text} ${text}`;
      return;
    }
    cues.push({ id: `cue-${cues.length + 1}`, startSeconds, text });
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || /^\d+$/.test(line)) continue;

    const srtRange = line.match(/^(\d{1,2}:\d{2}:\d{2}(?:[.,]\d{1,3})?)\s*-->/);
    if (srtRange) {
      pendingTime = timestampToSeconds(srtRange[1]);
      continue;
    }

    const prefixed = line.match(/^\[?((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\]?\s*[-–—]?\s*(.*)$/);
    if (prefixed) {
      const seconds = timestampToSeconds(prefixed[1]);
      if (seconds !== null && prefixed[2]) {
        addCue(seconds, prefixed[2]);
        pendingTime = null;
      } else {
        pendingTime = seconds;
      }
      continue;
    }

    const estimatedTime = pendingTime ?? (cues.length === 0 ? 0 : cues[cues.length - 1].startSeconds + 8);
    addCue(estimatedTime, line);
    pendingTime = null;
  }

  return cues;
}

function wordsIn(text: string): string[] {
  return text.toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g) ?? [];
}

export function cefrToBand(cefr: string): number {
  if (cefr === 'C2') return 8.5;
  if (cefr === 'C1') return 7.5;
  return 6.5;
}

export function lookupVocabulary(word: string): VideoVocabulary | null {
  const bankEntry = VOCAB_MAP.get(word.toLowerCase());
  if (bankEntry) {
    return {
      word: bankEntry.word,
      definitionEn: bankEntry.definitionEn,
      definitionVi: bankEntry.definitionVi,
      cefr: bankEntry.cefrLevel,
      band: bankEntry.bandScore,
      phonetic: bankEntry.phonetic,
    };
  }

  const academicEntry = ACADEMIC_WORD_LIST[word];
  if (!academicEntry) return null;
  return {
    word,
    definitionEn: academicEntry.definition,
    definitionVi: academicEntry.definitionVi,
    cefr: academicEntry.cefr,
    band: cefrToBand(academicEntry.cefr),
    phonetic: '/.../',
  };
}

function replaceWord(text: string, answer: string): string {
  const escaped = answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`\\b${escaped}\\b`, 'i'), '_____');
}

export function createVideoLesson(input: string, questionLimit = 8): VideoLesson {
  const cues = parseTranscript(input);
  const vocabulary: VideoVocabulary[] = [];
  const seenVocabulary = new Set<string>();
  const candidates: { cue: TranscriptCue; answer: string }[] = [];
  let wordCount = 0;

  for (const cue of cues) {
    const words = wordsIn(cue.text);
    wordCount += words.length;

    let bestAnswer = '';
    let hasBestAcademic = false;
    let bestLength = 0;
    const seenInCue = new Set<string>();

    for (const word of words) {
      if (!seenInCue.has(word)) {
        seenInCue.add(word);

        if (vocabulary.length < 10 && !seenVocabulary.has(word)) {
          const entry = lookupVocabulary(word);
          if (entry) {
            vocabulary.push(entry);
            seenVocabulary.add(word);
          }
        }

        if (word.length >= 6 && !STOP_WORDS.has(word)) {
          const isAcademic = Boolean(lookupVocabulary(word));
          if (isAcademic && !hasBestAcademic) {
            bestAnswer = word;
            hasBestAcademic = true;
            bestLength = word.length;
          } else if (isAcademic === hasBestAcademic) {
            if (word.length > bestLength) {
              bestAnswer = word;
              bestLength = word.length;
            }
          }
        }
      }
    }

    if (bestAnswer) {
      candidates.push({ cue, answer: bestAnswer });
    }
  }

  const requestedLimit = Number.isFinite(questionLimit) ? Math.floor(questionLimit) : 8;
  const safeLimit = Math.max(1, Math.min(12, requestedLimit));
  const stride = candidates.length > safeLimit ? candidates.length / safeLimit : 1;
  const selected = Array.from(
    { length: Math.min(safeLimit, candidates.length) },
    (_, index) => candidates[Math.floor(index * stride)],
  );

  const questions = selected.map(({ cue, answer }, index) => ({
    id: `cloze-${index + 1}`,
    cueId: cue.id,
    startSeconds: cue.startSeconds,
    prompt: replaceWord(cue.text, answer),
    cueText: cue.text,
    answer,
    hint: `${answer[0].toUpperCase()} • ${answer.length} letters`,
  }));

  return {
    cues,
    questions,
    vocabulary,
    wordCount,
    durationSeconds: cues.length > 0 ? cues[cues.length - 1].startSeconds : 0,
  };
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase().replace(/[^a-z0-9'-]/g, '');
}

export function scoreLesson(questions: ClozeQuestion[], answers: Record<string, string>): number {
  return questions.reduce(
    (score, question) => score + Number(normalizeAnswer(answers[question.id] ?? '') === normalizeAnswer(question.answer)),
    0,
  );
}

export function formatTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function getYouTubeVideoId(value: string): string | null {
  const trimmed = value.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0]?.slice(0, 11) || null;
    if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const pathId = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1];
      return pathId ?? url.searchParams.get('v')?.slice(0, 11) ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export function calculateLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const matrix: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) matrix[i][0] = i;
  for (let j = 0; j <= n; j++) matrix[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[m][n];
}

export function calculatePronunciationScore(targetText: string, spokenText: string): PronunciationScoreResult {
  const targetWords = wordsIn(targetText);
  const spokenWords = wordsIn(spokenText);

  if (targetWords.length === 0) {
    return {
      score: 100,
      band: 9.0,
      matchedWords: [],
      feedbackEn: 'Flawless pronunciation and rhythm.',
      feedbackVi: 'Phát âm hoàn hảo và nhịp điệu tự nhiên.',
    };
  }

  if (spokenWords.length === 0) {
    return {
      score: 0,
      band: 5.0,
      matchedWords: targetWords.map(w => ({ word: w, status: 'missing', score: 0 })),
      feedbackEn: 'No speech detected. Please record clearly.',
      feedbackVi: 'Chưa phát hiện giọng nói. Hãy ghi âm lại rõ ràng hơn.',
    };
  }

  const matchedWords: PronunciationWordResult[] = [];
  let totalScore = 0;
  let spokenIndex = 0;

  for (let i = 0; i < targetWords.length; i++) {
    const target = targetWords[i];
    let matched = false;

    const maxLookahead = Math.min(spokenIndex + 3, spokenWords.length);
    for (let j = spokenIndex; j < maxLookahead; j++) {
      const spoken = spokenWords[j];
      if (target === spoken) {
        matchedWords.push({ word: target, status: 'correct', score: 1.0 });
        totalScore += 1.0;
        spokenIndex = j + 1;
        matched = true;
        break;
      }
      const distance = calculateLevenshteinDistance(target, spoken);
      const threshold = target.length > 5 ? 2 : 1;
      if (distance <= threshold) {
        matchedWords.push({ word: target, status: 'mispronounced', score: 0.6 });
        totalScore += 0.6;
        spokenIndex = j + 1;
        matched = true;
        break;
      }
    }

    if (!matched) {
      matchedWords.push({ word: target, status: 'missing', score: 0 });
    }
  }

  const rawScore = Math.round((totalScore / targetWords.length) * 100);
  const score = Math.max(0, Math.min(100, rawScore));

  let band = 5.0;
  let feedbackEn = '';
  let feedbackVi = '';

  if (score >= 92) {
    band = 9.0;
    feedbackEn = 'Band 9.0 · Native-level pronunciation, precise rhythm and natural connected speech.';
    feedbackVi = 'Band 9.0 · Phát âm chuẩn bản xứ, nhịp điệu tự nhiên và nối âm chính xác.';
  } else if (score >= 82) {
    band = 8.5;
    feedbackEn = 'Band 8.5 · Excellent phonetic clarity and intonation with minor stress variations.';
    feedbackVi = 'Band 8.5 · Độ rõ ràng âm vị xuất sắc kèm ngữ điệu rất tốt.';
  } else if (score >= 72) {
    band = 8.0;
    feedbackEn = 'Band 8.0 · Strong fluency and pronunciation with occasional vowel/consonant slips.';
    feedbackVi = 'Band 8.0 · Lưu loát và phát âm vững, chỉ có vài lỗi nhỏ ở phụ âm/nguyên âm.';
  } else if (score >= 60) {
    band = 7.5;
    feedbackEn = 'Band 7.5 · Good acoustic clarity; practice linking words and weak syllable reduction.';
    feedbackVi = 'Band 7.5 · Phát âm tốt; cần luyện thêm nối từ và giảm nhẹ âm tiết không nhấn.';
  } else if (score >= 50) {
    band = 7.0;
    feedbackEn = 'Band 7.0 · Generally clear with noticeable accent influence on multisyllabic terms.';
    feedbackVi = 'Band 7.0 · Nhìn chung rõ ràng, cần chú ý trọng âm ở các từ nhiều âm tiết.';
  } else if (score >= 40) {
    band = 6.5;
    feedbackEn = 'Band 6.5 · Some dropped word endings or mispronounced vowel sounds detected.';
    feedbackVi = 'Band 6.5 · Một số âm đuôi bị nuốt hoặc phát âm chưa chuẩn nguyên âm.';
  } else if (score >= 30) {
    band = 6.0;
    feedbackEn = 'Band 6.0 · Shadow this chunk 2-3 more times to internalize stress and intonation.';
    feedbackVi = 'Band 6.0 · Hãy nhại lại đoạn này 2-3 lần để quen với ngữ điệu và trọng âm.';
  } else if (score >= 20) {
    band = 5.5;
    feedbackEn = 'Band 5.5 · Moderate speech rate; repeat slowly and focus on word boundaries.';
    feedbackVi = 'Band 5.5 · Tốc độ nói vừa phải; hãy luyện chậm từng từ và ranh giới phát âm.';
  } else {
    band = 5.0;
    feedbackEn = 'Band 5.0 · Frequent omissions or pronunciation deviations. Keep practicing!';
    feedbackVi = 'Band 5.0 · Nhiều từ bị bỏ qua hoặc phát âm sai lệch. Tiếp tục luyện tập nhé!';
  }

  return {
    score,
    band,
    matchedWords,
    feedbackEn,
    feedbackVi,
  };
}

export const CURATED_IELTS_LESSONS: CuratedLesson[] = [
  {
    id: 'curated-spk-part1',
    title: 'IELTS Speaking Part 1: Work-Life Balance & Urban Living',
    category: 'speaking-part1',
    description: 'Band 8.5 model response answering Part 1 questions about personal career habits, leisure time, and metropolitan lifestyle.',
    transcript: `[00:00] In contemporary society, maintaining a harmonious work-life balance is indispensable.
[00:06] Many professionals struggle to allocate adequate time for physical exercise and family commitments.
[00:12] Furthermore, rapid urbanization often exacerbates daily commute times and stress levels.
[00:18] Consequently, adopting flexible schedules enables individuals to enhance overall productivity and wellbeing.
[00:24] To conclude, prioritizing mental health fosters long-term professional sustainability.`,
    targetBand: 8.5,
    keyWords: ['contemporary', 'indispensable', 'allocate', 'urbanization', 'exacerbates', 'productivity', 'sustainability'],
    durationSeconds: 30,
  },
  {
    id: 'curated-spk-part2',
    title: 'IELTS Speaking Part 2: Environmental Conservation Initiative (Cue Card)',
    category: 'speaking-part2',
    description: 'Band 9.0 long turn describing a community renewable energy and recycling project with advanced discourse markers.',
    transcript: `[00:00] I would like to delineate an innovative environmental project initiated in my hometown.
[00:07] The primary objective was to facilitate municipal waste reduction through localized composting hubs.
[00:14] Initially, residents exhibited skepticism regarding the project feasibility and operational logistics.
[00:21] However, comprehensive educational workshops significantly augmented citizen participation across all demographics.
[00:28] In hindsight, this grassroots initiative exemplifies how community solidarity can mitigate ecological degradation.`,
    targetBand: 9.0,
    keyWords: ['delineate', 'facilitate', 'municipal', 'skepticism', 'augmented', 'exemplifies', 'mitigate', 'ecological'],
    durationSeconds: 35,
  },
  {
    id: 'curated-spk-part3',
    title: 'IELTS Speaking Part 3: Artificial Intelligence and Future Employment',
    category: 'speaking-part3',
    description: 'Band 9.0 academic two-way discussion analyzing algorithmic automation, ethical oversight, and workforce transitions.',
    transcript: `[00:00] It is widely acknowledged that artificial intelligence will transform global labor markets exponentially.
[00:07] While repetitive computational tasks will inevitably become automated, human creativity remains irreplaceable.
[00:14] Therefore, educational institutions must restructure their curricula to cultivate critical thinking and problem-solving skills.
[00:21] Moreover, regulatory frameworks are imperative to prevent algorithmic bias and preserve workforce equity.
[00:28] Ultimately, embracing technological evolution while safeguarding societal welfare requires proactive governmental intervention.`,
    targetBand: 9.0,
    keyWords: ['exponentially', 'computational', 'inevitably', 'restructure', 'curricula', 'imperative', 'algorithmic', 'safeguarding'],
    durationSeconds: 35,
  },
  {
    id: 'curated-lis-sec4',
    title: 'IELTS Listening Section 4: Cognitive Psychology & Mnemonic Systems',
    category: 'academic-lecture',
    description: 'Authentic university lecture monologue on human memory consolidation, spaced intervals, and neurological encoding.',
    transcript: `[00:00] Good morning everyone. Today we examine how cognitive architectures consolidate semantic memory.
[00:07] Empirical investigations demonstrate that passive re-reading yields negligible long-term retention.
[00:14] Conversely, active retrieval practice strengthens neural pathways and optimizes synaptic plasticity.
[00:21] Furthermore, spacing review sessions according to mathematical decay functions impedes forgetting.
[00:28] In summary, structured retrieval constitutes the cornerstone of durable academic mastery.`,
    targetBand: 8.5,
    keyWords: ['cognitive', 'consolidate', 'empirical', 'negligible', 'retention', 'retrieval', 'synaptic', 'constitutes'],
    durationSeconds: 35,
  },
];
