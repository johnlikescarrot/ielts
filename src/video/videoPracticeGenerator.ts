import { parseEssayToAST } from '../ast/astParser';
import { ACADEMIC_WORD_LIST } from '../ast/awlList';
import { ASTRYX_REFERENCE } from '../astryx/astryxIntegration';

export type SupportedVideoPlatform = 'youtube' | 'bilibili' | 'generic';

export interface VideoTranscriptInput {
  title?: string;
  sourceUrl?: string;
  transcript: string;
  durationSeconds?: number;
}

export interface TranscriptSegment {
  id: string;
  startSeconds: number;
  text: string;
  speaker?: string;
}

export interface VideoVocabularyInsight {
  word: string;
  definitionEn: string;
  definitionVi: string;
  cefr: string;
  band: number;
  frequency: number;
  isAcademic: boolean;
}

export interface VideoListeningQuestion {
  id: string;
  prompt: string;
  sentenceWithBlank: string;
  correctAnswer: string;
  timestampSeconds: number;
  explanationEn: string;
  explanationVi: string;
}

export interface VideoReadingQuestion {
  id: string;
  prompt: string;
  answer: 'True' | 'False' | 'Not Given';
  evidence: string;
  explanationEn: string;
  explanationVi: string;
}

export interface VideoSpeakingPrompt {
  part: 1 | 2 | 3;
  prompt: string;
  supportPoints: string[];
  modelStarter: string;
}

export interface VideoWritingTask {
  taskType: 'task2-discussion';
  prompt: string;
  planningAngles: string[];
  usefulLanguage: string[];
}

export interface VideoPracticePack {
  id: string;
  title: string;
  sourceUrl: string;
  platform: SupportedVideoPlatform;
  summary: string;
  normalizedTranscript: string;
  segments: TranscriptSegment[];
  insights: {
    wordCount: number;
    sentenceCount: number;
    estimatedListeningMinutes: number;
    academicWordDensity: number;
    topTopics: string[];
    astryxSource: string;
  };
  listeningQuestions: VideoListeningQuestion[];
  readingQuestions: VideoReadingQuestion[];
  speakingPrompts: VideoSpeakingPrompt[];
  writingTask: VideoWritingTask;
  vocabulary: VideoVocabularyInsight[];
  actionPlan: string[];
  createdAt: string;
}

const STOP_WORDS = new Set([
  'about', 'above', 'after', 'again', 'against', 'also', 'among', 'because', 'before', 'being', 'between',
  'could', 'every', 'first', 'from', 'have', 'into', 'just', 'more', 'most', 'other', 'people', 'should',
  'their', 'there', 'these', 'thing', 'those', 'through', 'under', 'where', 'which', 'while', 'would', 'your',
  'with', 'without', 'this', 'that', 'they', 'them', 'then', 'than', 'when', 'what', 'were', 'will', 'been',
  'many', 'such', 'very', 'some', 'only', 'over', 'video', 'speaker', 'today', 'like', 'make', 'made', 'well',
]);

const FALLBACK_TOPICS = ['learning', 'communication', 'technology', 'education'];

export function detectVideoPlatform(sourceUrl = ''): SupportedVideoPlatform {
  const lowerUrl = sourceUrl.toLowerCase();
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  if (lowerUrl.includes('bilibili.com') || lowerUrl.includes('b23.tv')) return 'bilibili';
  return 'generic';
}

export function parseTimestampToSeconds(rawTimestamp: string): number {
  const parts = rawTimestamp.split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

export function normalizeTranscript(rawTranscript: string): string {
  return rawTranscript
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line
      .replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*[-–—]?\s*/u, '')
      .replace(/^[A-Z][A-Za-z\s]{0,24}:\s+/u, '')
      .replace(/\s+/g, ' ')
      .trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitTranscriptSegments(rawTranscript: string, durationSeconds?: number): TranscriptSegment[] {
  const lines = rawTranscript.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const timestampRegex = /^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*[-–—]?\s*/u;
  const explicitSegments = lines.map((line, index) => {
    const timestamp = line.match(timestampRegex);
    const textWithoutTimestamp = line.replace(timestampRegex, '').trim();
    const speakerMatch = textWithoutTimestamp.match(/^([A-Z][A-Za-z\s]{0,24}):\s+(.+)$/u);
    const text = (speakerMatch?.[2] || textWithoutTimestamp).replace(/\s+/g, ' ').trim();

    return {
      id: `seg_${index + 1}`,
      startSeconds: timestamp ? parseTimestampToSeconds(timestamp[1]) : 0,
      speaker: speakerMatch?.[1],
      text,
    };
  }).filter(segment => segment.text.length > 0);

  if (explicitSegments.length > 0 && explicitSegments.some(segment => segment.startSeconds > 0)) {
    return explicitSegments;
  }

  const normalized = normalizeTranscript(rawTranscript);
  const sentenceMatches = normalized.match(/[^.!?]+[.!?]+|[^.!?]+$/gu) || [];
  const cleanedSentences = sentenceMatches.map(sentence => sentence.trim()).filter(Boolean);
  const estimatedDuration = durationSeconds || Math.max(60, Math.round((normalized.split(/\s+/).length / 150) * 60));
  const segmentStep = cleanedSentences.length > 1 ? estimatedDuration / cleanedSentences.length : 0;

  return cleanedSentences.map((sentence, index) => ({
    id: `seg_${index + 1}`,
    startSeconds: Math.round(index * segmentStep),
    text: sentence,
  }));
}

export function formatTimestamp(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateBandForCefr(cefr: string): number {
  if (cefr === 'C2') return 8.5;
  if (cefr === 'C1') return 7.5;
  if (cefr === 'B2') return 6.5;
  return 6.0;
}

function sentenceCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return `${trimmed[0].toUpperCase()}${trimmed.slice(1)}`;
}

function sanitizeKeyword(rawWord: string): string {
  return rawWord.toLowerCase().replace(/[^a-z-]/g, '').replace(/^-+|-+$/g, '');
}

function buildWordFrequency(transcript: string): Map<string, number> {
  const frequency = new Map<string, number>();
  const matches = transcript.toLowerCase().match(/[a-z][a-z'-]{2,}/gu) || [];
  matches.forEach(rawWord => {
    const word = sanitizeKeyword(rawWord);
    if (word.length < 4 || STOP_WORDS.has(word)) return;
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });
  return frequency;
}

function getTopTopics(frequency: Map<string, number>, maxTopics = 4): string[] {
  const ranked = [...frequency.entries()]
    .sort((a, b) => {
      const academicDelta = Number(!!ACADEMIC_WORD_LIST[b[0]]) - Number(!!ACADEMIC_WORD_LIST[a[0]]);
      if (academicDelta !== 0) return academicDelta;
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    })
    .map(([word]) => word)
    .slice(0, maxTopics);

  return ranked.length > 0 ? ranked : FALLBACK_TOPICS.slice(0, maxTopics);
}

export function extractVideoVocabulary(transcript: string, maxWords = 8): VideoVocabularyInsight[] {
  const frequency = buildWordFrequency(transcript);
  const rankedWords = [...frequency.entries()]
    .sort((a, b) => {
      const academicDelta = Number(!!ACADEMIC_WORD_LIST[b[0]]) - Number(!!ACADEMIC_WORD_LIST[a[0]]);
      if (academicDelta !== 0) return academicDelta;
      return b[1] - a[1] || b[0].length - a[0].length || a[0].localeCompare(b[0]);
    })
    .slice(0, maxWords);

  return rankedWords.map(([word, count]) => {
    const awl = ACADEMIC_WORD_LIST[word];
    const cefr = awl?.cefr || (word.length > 9 ? 'C1' : 'B2');
    return {
      word,
      definitionEn: awl?.definition || `A key term from this video connected to ${word}.`,
      definitionVi: awl?.definitionVi || `Từ khóa trong video liên quan đến ${word}.`,
      cefr,
      band: calculateBandForCefr(cefr),
      frequency: count,
      isAcademic: !!awl,
    };
  });
}

function findBestSegmentForWord(segments: TranscriptSegment[], word: string, fallbackIndex: number): TranscriptSegment {
  const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'iu');
  return segments.find(segment => pattern.test(segment.text)) || segments[fallbackIndex % Math.max(segments.length, 1)] || {
    id: 'seg_1',
    startSeconds: 0,
    text: word,
  };
}

function blankKeywordInSentence(sentence: string, keyword: string): string {
  const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'iu');
  if (pattern.test(sentence)) {
    return sentence.replace(pattern, '_____');
  }
  return `${sentence.replace(/[.!?]?$/u, '')} _____`; 
}

function buildListeningQuestions(segments: TranscriptSegment[], vocabulary: VideoVocabularyInsight[]): VideoListeningQuestion[] {
  return vocabulary.slice(0, 5).map((item, index) => {
    const segment = findBestSegmentForWord(segments, item.word, index);
    return {
      id: `vl_${index + 1}`,
      prompt: `Complete the note at ${formatTimestamp(segment.startSeconds)} with one word from the video.`,
      sentenceWithBlank: blankKeywordInSentence(segment.text, item.word),
      correctAnswer: item.word,
      timestampSeconds: segment.startSeconds,
      explanationEn: `The transcript uses "${item.word}" in this context: ${segment.text}`,
      explanationVi: `Bản ghi sử dụng "${item.word}" trong ngữ cảnh: ${segment.text}`,
    };
  });
}

function buildReadingQuestions(segments: TranscriptSegment[], topTopics: string[]): VideoReadingQuestion[] {
  const firstEvidence = segments[0]?.text || `The video introduces ${topTopics[0]}.`;
  const secondEvidence = segments[1]?.text || firstEvidence;
  const topic = topTopics[0] || FALLBACK_TOPICS[0];

  return [
    {
      id: 'vr_1',
      prompt: `The speaker mentions ${topic} as an important idea in the video.`,
      answer: 'True',
      evidence: firstEvidence,
      explanationEn: 'This statement is supported by the opening part of the transcript.',
      explanationVi: 'Nhận định này được hỗ trợ bởi phần mở đầu của bản ghi.',
    },
    {
      id: 'vr_2',
      prompt: `The video says there are no challenges or trade-offs connected with ${topic}.`,
      answer: 'False',
      evidence: secondEvidence,
      explanationEn: 'The transcript discusses the topic with nuance rather than saying there are no challenges.',
      explanationVi: 'Bản ghi bàn về chủ đề một cách có sắc thái, không nói rằng không có thách thức.',
    },
    {
      id: 'vr_3',
      prompt: `The speaker gives the exact IELTS test date when this topic will appear.`,
      answer: 'Not Given',
      evidence: 'No exam date is provided in the transcript.',
      explanationEn: 'This information is not stated, so the correct IELTS Reading response is Not Given.',
      explanationVi: 'Thông tin này không được nêu, nên đáp án IELTS Reading đúng là Not Given.',
    },
  ];
}

function buildSpeakingPrompts(topTopics: string[]): VideoSpeakingPrompt[] {
  const [primary, secondary = 'learning', tertiary = 'society'] = topTopics;
  return [
    {
      part: 1,
      prompt: `Do you often watch videos about ${primary}? Why or why not?`,
      supportPoints: ['personal habit', 'useful vocabulary', 'one concrete example'],
      modelStarter: `I tend to watch videos about ${primary} when I want a practical overview, because they make abstract ideas easier to remember.`,
    },
    {
      part: 2,
      prompt: `Describe a video about ${primary} that taught you something useful.`,
      supportPoints: [`what the video explained about ${primary}`, `how it connected to ${secondary}`, 'why it was memorable', 'how you would use the idea in IELTS'],
      modelStarter: `One memorable video I watched focused on ${primary}, and what stood out was the way it linked the idea to real-life examples.`,
    },
    {
      part: 3,
      prompt: `How might ${primary} and ${secondary} influence ${tertiary} in the future?`,
      supportPoints: ['short-term effects', 'long-term consequences', 'balanced counterargument'],
      modelStarter: `From a broader perspective, ${primary} could reshape ${tertiary}, although the impact depends on access, motivation, and public policy.`,
    },
  ];
}

function buildWritingTask(topTopics: string[]): VideoWritingTask {
  const [primary, secondary = 'education'] = topTopics;
  return {
    taskType: 'task2-discussion',
    prompt: `Some people believe that videos about ${primary} are one of the most effective ways to learn about ${secondary}. Others think traditional study is still more reliable. Discuss both views and give your own opinion.`,
    planningAngles: [
      `Explain how video examples make ${primary} concrete and memorable.`,
      `Compare passive watching with deliberate IELTS note-taking and review.`,
      `Give a balanced opinion that combines video input with structured practice.`,
    ],
    usefulLanguage: [
      'It is widely argued that...',
      'A more balanced approach would be...',
      'This is particularly relevant when learners need to...',
      'Nevertheless, this advantage depends on...',
    ],
  };
}

function buildActionPlan(vocabulary: VideoVocabularyInsight[], topTopics: string[]): string[] {
  const vocabItems = vocabulary.slice(0, 3).map(item => item.word).join(', ') || topTopics.slice(0, 3).join(', ');
  return [
    `Listen once for gist, then replay the ${vocabulary.length} generated gap-fill moments and shadow the sentences aloud.`,
    `Add ${vocabItems} to SRS and write one original IELTS sentence for each word.`,
    `Record a 90-second Part 2 answer about ${topTopics[0] || 'the video topic'} using at least two source examples.`,
    'Write a Task 2 outline in 6 minutes: thesis, two topic sentences, one counterargument, and conclusion.',
  ];
}

function buildSummary(segments: TranscriptSegment[], topTopics: string[]): string {
  const opener = segments[0]?.text.replace(/\s+/g, ' ').trim();
  if (opener && opener.length > 30) {
    return `${sentenceCase(opener.replace(/[.!?]+$/u, ''))}. Key IELTS themes: ${topTopics.join(', ')}.`;
  }
  return `This video is converted into IELTS practice around ${topTopics.join(', ')} with listening, reading, speaking, writing, and vocabulary drills.`;
}

export function generateVideoPracticePack(input: VideoTranscriptInput): VideoPracticePack {
  const normalizedTranscript = normalizeTranscript(input.transcript);
  const safeTranscript = normalizedTranscript || 'This video introduces learning, communication, technology, and education for IELTS practice.';
  const ast = parseEssayToAST(safeTranscript);
  const segments = splitTranscriptSegments(input.transcript || safeTranscript, input.durationSeconds);
  const frequency = buildWordFrequency(safeTranscript);
  const topTopics = getTopTopics(frequency);
  const vocabulary = extractVideoVocabulary(safeTranscript);
  const academicWordCount = vocabulary.filter(item => item.isAcademic).reduce((sum, item) => sum + item.frequency, 0);
  const wordCount = ast.totalWords || safeTranscript.split(/\s+/).filter(Boolean).length;
  const estimatedDuration = input.durationSeconds || Math.max(60, Math.round((wordCount / 150) * 60));

  return {
    id: `video_lab_${Math.abs([...safeTranscript].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0))}`,
    title: input.title?.trim() || 'Untitled IELTS Video Drill',
    sourceUrl: input.sourceUrl?.trim() || '',
    platform: detectVideoPlatform(input.sourceUrl),
    summary: buildSummary(segments, topTopics),
    normalizedTranscript: safeTranscript,
    segments,
    insights: {
      wordCount,
      sentenceCount: ast.totalSentences,
      estimatedListeningMinutes: Math.max(1, Math.round(estimatedDuration / 60)),
      academicWordDensity: Math.round((academicWordCount / Math.max(wordCount, 1)) * 1000) / 10,
      topTopics,
      astryxSource: ASTRYX_REFERENCE.source,
    },
    listeningQuestions: buildListeningQuestions(segments, vocabulary),
    readingQuestions: buildReadingQuestions(segments, topTopics),
    speakingPrompts: buildSpeakingPrompts(topTopics),
    writingTask: buildWritingTask(topTopics),
    vocabulary,
    actionPlan: buildActionPlan(vocabulary, topTopics),
    createdAt: new Date().toISOString(),
  };
}
