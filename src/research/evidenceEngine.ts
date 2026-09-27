import { SkillType } from '../types';

export type EvidenceSkill = Extract<
  SkillType,
  'reading' | 'listening' | 'writing' | 'speaking' | 'vocabulary'
>;

export interface EvidenceReference {
  id: string;
  title: string;
  authors: string;
  year: number;
  venue: string;
  skills: EvidenceSkill[];
  tags: string[];
  insightEn: string;
  insightVi: string;
  scholarQuery: string;
}

export interface EvidenceCoverageSummary {
  totalReferences: number;
  bySkill: Record<EvidenceSkill, number>;
  yearRange: string;
  topTags: string[];
}

export interface EvidenceStudyPlanInput {
  targetBand: number;
  weeklyMinutes: number;
  prioritySkills?: EvidenceSkill[];
  language?: 'en' | 'vi';
}

export interface EvidenceStudyPlanItem {
  skill: EvidenceSkill;
  minutes: number;
  rationale: string;
  referenceIds: string[];
}

export const EVIDENCE_SKILLS: EvidenceSkill[] = [
  'reading',
  'listening',
  'writing',
  'speaking',
  'vocabulary',
];

export const IELTS_RESEARCH_REFERENCES: EvidenceReference[] = [
  {
    id: 'coxhead-2000-awl',
    title: 'A New Academic Word List',
    authors: 'Averil Coxhead',
    year: 2000,
    venue: 'TESOL Quarterly',
    skills: ['vocabulary', 'writing', 'reading'],
    tags: ['Academic Word List', 'lexical resource', 'corpus'],
    insightEn: 'Prioritize high-utility academic vocabulary and collocations that recur across disciplines.',
    insightVi: 'Ưu tiên từ vựng học thuật và collocation xuất hiện thường xuyên trong nhiều lĩnh vực.',
    scholarQuery: 'Averil Coxhead 2000 A New Academic Word List TESOL Quarterly',
  },
  {
    id: 'nation-2001-vocabulary',
    title: 'Learning Vocabulary in Another Language',
    authors: 'I. S. P. Nation',
    year: 2001,
    venue: 'Cambridge University Press',
    skills: ['vocabulary', 'listening', 'reading'],
    tags: ['spaced repetition', 'retrieval practice', 'lexical coverage'],
    insightEn: 'Combine meaning-focused input with retrieval and spaced review for durable vocabulary growth.',
    insightVi: 'Kết hợp đầu vào có ý nghĩa với truy hồi chủ động và ôn tập ngắt quãng để nhớ từ bền vững.',
    scholarQuery: 'I S P Nation 2001 Learning Vocabulary in Another Language',
  },
  {
    id: 'grabe-2009-reading',
    title: 'Reading in a Second Language: Moving from Theory to Practice',
    authors: 'William Grabe',
    year: 2009,
    venue: 'Cambridge University Press',
    skills: ['reading', 'vocabulary'],
    tags: ['reading fluency', 'schema', 'strategy training'],
    insightEn: 'Build passage fluency with timed reading, strategic skimming, and vocabulary recycling.',
    insightVi: 'Tăng tốc độ đọc bằng bài đọc bấm giờ, đọc lướt có chiến lược và tái sử dụng từ vựng.',
    scholarQuery: 'William Grabe 2009 Reading in a Second Language Moving from Theory to Practice',
  },
  {
    id: 'field-2008-listening',
    title: 'Listening in the Language Classroom',
    authors: 'John Field',
    year: 2008,
    venue: 'Cambridge University Press',
    skills: ['listening', 'speaking'],
    tags: ['bottom-up listening', 'phonology', 'noticing'],
    insightEn: 'Train decoding, prediction, and post-listening reflection instead of only checking answers.',
    insightVi: 'Luyện giải mã âm thanh, dự đoán và tự phản tỉnh sau khi nghe thay vì chỉ kiểm tra đáp án.',
    scholarQuery: 'John Field 2008 Listening in the Language Classroom',
  },
  {
    id: 'hyland-2003-writing',
    title: 'Second Language Writing',
    authors: 'Ken Hyland',
    year: 2003,
    venue: 'Cambridge University Press',
    skills: ['writing'],
    tags: ['genre', 'feedback', 'academic writing'],
    insightEn: 'Use genre-aware models, focused feedback, and revision cycles for IELTS Task 1 and Task 2.',
    insightVi: 'Dùng bài mẫu theo thể loại, phản hồi có trọng tâm và chu kỳ sửa bài cho IELTS Task 1 và Task 2.',
    scholarQuery: 'Ken Hyland 2003 Second Language Writing',
  },
  {
    id: 'skehan-1998-speaking',
    title: 'A Cognitive Approach to Language Learning',
    authors: 'Peter Skehan',
    year: 1998,
    venue: 'Oxford University Press',
    skills: ['speaking', 'writing'],
    tags: ['fluency', 'complexity', 'accuracy'],
    insightEn: 'Balance fluency, grammatical complexity, and accuracy through timed production tasks.',
    insightVi: 'Cân bằng độ trôi chảy, độ phức tạp ngữ pháp và độ chính xác bằng bài nói/viết bấm giờ.',
    scholarQuery: 'Peter Skehan 1998 A Cognitive Approach to Language Learning fluency complexity accuracy',
  },
  {
    id: 'weir-2005-validation',
    title: 'Language Testing and Validation',
    authors: 'Cyril J. Weir',
    year: 2005,
    venue: 'Palgrave Macmillan',
    skills: ['reading', 'listening', 'writing', 'speaking'],
    tags: ['assessment validity', 'test design', 'IELTS readiness'],
    insightEn: 'Practice tasks should align with test purpose, response format, timing, and scoring criteria.',
    insightVi: 'Bài luyện nên bám sát mục đích bài thi, dạng trả lời, thời gian và tiêu chí chấm điểm.',
    scholarQuery: 'Cyril Weir 2005 Language Testing and Validation',
  },
];

export function buildScholarSearchUrl(queryOrReference: string | EvidenceReference): string {
  const query = typeof queryOrReference === 'string'
    ? queryOrReference
    : queryOrReference.scholarQuery;
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query.trim())}`;
}

export function getEvidenceReferences(skill?: EvidenceSkill): EvidenceReference[] {
  return skill
    ? IELTS_RESEARCH_REFERENCES.filter(reference => reference.skills.includes(skill))
    : [...IELTS_RESEARCH_REFERENCES];
}

export function summarizeEvidenceCoverage(
  references: EvidenceReference[] = IELTS_RESEARCH_REFERENCES
): EvidenceCoverageSummary {
  const bySkill = Object.fromEntries(EVIDENCE_SKILLS.map(skill => [skill, 0])) as Record<EvidenceSkill, number>;
  const tagCounts = new Map<string, number>();
  const years = references.map(reference => reference.year);

  references.forEach(reference => {
    reference.skills.forEach(skill => {
      bySkill[skill] += 1;
    });
    reference.tags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    });
  });

  const sortedTags = [...tagCounts.entries()]
    .sort(([tagA, countA], [tagB, countB]) => countB - countA || tagA.localeCompare(tagB))
    .map(([tag]) => tag);

  const minYear = years.length > 0 ? Math.min(...years) : 0;
  const maxYear = years.length > 0 ? Math.max(...years) : 0;

  return {
    totalReferences: references.length,
    bySkill,
    yearRange: years.length > 0 ? `${minYear}-${maxYear}` : 'n/a',
    topTags: sortedTags.slice(0, 5),
  };
}

export function createScholarCitationKit(language: 'en' | 'vi' = 'en'): string {
  const heading = language === 'vi'
    ? '# Bộ nguồn nghiên cứu IELTS Slayer'
    : '# IELTS Slayer Research Evidence Kit';
  const intro = language === 'vi'
    ? 'Các nguồn dưới đây giúp người học kiểm chứng cơ sở học thuật qua Google Scholar.'
    : 'Use these sources to validate the learning design through Google Scholar.';

  const entries = IELTS_RESEARCH_REFERENCES.map(reference => {
    const insight = language === 'vi' ? reference.insightVi : reference.insightEn;
    return [
      `## ${reference.authors} (${reference.year})`,
      reference.title,
      `Venue: ${reference.venue}`,
      `Skills: ${reference.skills.join(', ')}`,
      `Insight: ${insight}`,
      `Scholar: ${buildScholarSearchUrl(reference)}`,
    ].join('\n');
  });

  return [heading, intro, ...entries].join('\n\n');
}

export function generateEvidenceStudyPlan(input: EvidenceStudyPlanInput): EvidenceStudyPlanItem[] {
  const targetBand = Math.min(9, Math.max(4, input.targetBand));
  const weeklyMinutes = Math.max(30, Math.round(input.weeklyMinutes));
  const prioritySkills = input.prioritySkills?.length ? input.prioritySkills : EVIDENCE_SKILLS;
  const language = input.language ?? 'en';
  const baseMinutes = Math.floor(weeklyMinutes / prioritySkills.length);
  const remainder = weeklyMinutes % prioritySkills.length;

  return prioritySkills.map((skill, index) => {
    const references = getEvidenceReferences(skill).slice(0, 3);
    const minutes = baseMinutes + (index < remainder ? 1 : 0);
    const rationale = language === 'vi'
      ? `Band ${targetBand.toFixed(1)}: luyện ${skill} ${minutes} phút/tuần dựa trên ${references.length} nguồn nghiên cứu.`
      : `Band ${targetBand.toFixed(1)}: train ${skill} for ${minutes} minutes/week using ${references.length} research-backed sources.`;

    return {
      skill,
      minutes,
      rationale,
      referenceIds: references.map(reference => reference.id),
    };
  });
}
