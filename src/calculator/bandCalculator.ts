import { ExamType, SkillType } from '../types';

export interface ScoreBreakdown {
  rawScore: number;
  totalQuestions: number;
  percentage: number;
  bandScore: number;
  cefrLevel: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  skillDescriptorEn: string;
  skillDescriptorVi: string;
}

export function calculateListeningBand(rawScore: number, totalQuestions = 40): number {
  const scaledScore = totalQuestions === 40 ? rawScore : Math.round((rawScore / totalQuestions) * 40);

  if (scaledScore >= 39) return 9.0;
  if (scaledScore >= 37) return 8.5;
  if (scaledScore >= 35) return 8.0;
  if (scaledScore >= 32) return 7.5;
  if (scaledScore >= 30) return 7.0;
  if (scaledScore >= 26) return 6.5;
  if (scaledScore >= 23) return 6.0;
  if (scaledScore >= 18) return 5.5;
  if (scaledScore >= 16) return 5.0;
  if (scaledScore >= 13) return 4.5;
  if (scaledScore >= 10) return 4.0;
  if (scaledScore >= 8) return 3.5;
  if (scaledScore >= 6) return 3.0;
  if (scaledScore >= 4) return 2.5;
  if (scaledScore >= 1) return 2.0;
  return 1.0;
}

export function calculateReadingBand(rawScore: number, totalQuestions = 40, examType: ExamType = 'academic'): number {
  const scaledScore = totalQuestions === 40 ? rawScore : Math.round((rawScore / totalQuestions) * 40);

  if (examType === 'academic') {
    if (scaledScore >= 39) return 9.0;
    if (scaledScore >= 37) return 8.5;
    if (scaledScore >= 35) return 8.0;
    if (scaledScore >= 33) return 7.5;
    if (scaledScore >= 30) return 7.0;
    if (scaledScore >= 27) return 6.5;
    if (scaledScore >= 23) return 6.0;
    if (scaledScore >= 19) return 5.5;
    if (scaledScore >= 15) return 5.0;
    if (scaledScore >= 13) return 4.5;
    if (scaledScore >= 10) return 4.0;
    if (scaledScore >= 8) return 3.5;
    if (scaledScore >= 6) return 3.0;
    if (scaledScore >= 4) return 2.5;
    if (scaledScore >= 1) return 2.0;
    return 1.0;
  } else {
    // General Training
    if (scaledScore >= 40) return 9.0;
    if (scaledScore >= 39) return 8.5;
    if (scaledScore >= 37) return 8.0;
    if (scaledScore >= 36) return 7.5;
    if (scaledScore >= 34) return 7.0;
    if (scaledScore >= 32) return 6.5;
    if (scaledScore >= 30) return 6.0;
    if (scaledScore >= 27) return 5.5;
    if (scaledScore >= 23) return 5.0;
    if (scaledScore >= 19) return 4.5;
    if (scaledScore >= 15) return 4.0;
    if (scaledScore >= 12) return 3.5;
    if (scaledScore >= 9) return 3.0;
    if (scaledScore >= 6) return 2.5;
    if (scaledScore >= 1) return 2.0;
    return 1.0;
  }
}

export function calculateOverallBand(scores: {
  listening?: number;
  reading?: number;
  writing?: number;
  speaking?: number;
}): number {
  const validScores = [scores.listening, scores.reading, scores.writing, scores.speaking].filter(
    (s): s is number => typeof s === 'number' && !isNaN(s) && s >= 1.0 && s <= 9.0,
  );

  if (validScores.length === 0) return 0;

  const average = validScores.reduce((sum, s) => sum + s, 0) / validScores.length;
  const floor = Math.floor(average);
  const fraction = average - floor;

  // Official IELTS rounding rules:
  // .00 to .24 -> .0
  // .25 to .74 -> .5
  // .75 to .99 -> 1.0 (ceil)
  if (fraction < 0.25) {
    return floor;
  } else if (fraction < 0.75) {
    return floor + 0.5;
  } else {
    return floor + 1.0;
  }
}

export function getCEFRLevel(band: number): 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
  if (band >= 8.5) return 'C2';
  if (band >= 7.0) return 'C1';
  if (band >= 5.5) return 'B2';
  if (band >= 4.0) return 'B1';
  return 'A2';
}

export function getBandDescriptor(band: number): { en: string; vi: string } {
  if (band >= 9.0) {
    return {
      en: 'Expert User - Has fully operational command of the language: appropriate, accurate and fluent with complete understanding.',
      vi: 'Thông thạo hoàn toàn - Sử dụng ngôn ngữ chuẩn xác, lưu loát và thấu hiểu toàn diện như người bản xứ.',
    };
  }
  if (band >= 8.0) {
    return {
      en: 'Very Good User - Has fully operational command of the language with only occasional unsystematic inaccuracies.',
      vi: 'Rất tốt - Làm chủ ngôn ngữ hoàn toàn, chỉ thỉnh thoảng mắc lỗi không có tính hệ thống.',
    };
  }
  if (band >= 7.0) {
    return {
      en: 'Good User - Has operational command of the language, though with occasional inaccuracies and misunderstandings in some situations.',
      vi: 'Tốt - Nắm chắc ngôn ngữ, dù có thể có một vài sai sót hoặc hiểu nhầm trong một số tình huống phức tạp.',
    };
  }
  if (band >= 6.0) {
    return {
      en: 'Competent User - Has generally effective command of the language despite some inaccuracies and misunderstandings.',
      vi: 'Khá - Sử dụng ngôn ngữ nhìn chung hiệu quả, dù còn một số lỗi dùng từ hoặc ngữ pháp trong tình huống phức tạp.',
    };
  }
  if (band >= 5.0) {
    return {
      en: 'Modest User - Has partial command of the language, coping with overall meaning in most situations.',
      vi: 'Trung bình - Làm chủ ngôn ngữ một phần, nắm được ý chính trong phần lớn các tình huống quen thuộc.',
    };
  }
  return {
    en: 'Limited User - Basic competence is limited to familiar situations.',
    vi: 'Cơ bản - Năng lực cơ bản chỉ giới hạn trong các tình huống quen thuộc.',
  };
}

export function getScoreBreakdown(
  skill: SkillType,
  rawScore: number,
  totalQuestions: number,
  examType: ExamType = 'academic',
): ScoreBreakdown {
  let band = 1.0;
  if (skill === 'listening') {
    band = calculateListeningBand(rawScore, totalQuestions);
  } else if (skill === 'reading') {
    band = calculateReadingBand(rawScore, totalQuestions, examType);
  } else {
    band = Math.min(9.0, Math.max(1.0, rawScore));
  }

  const percentage = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;
  const cefrLevel = getCEFRLevel(band);
  const descriptors = getBandDescriptor(band);

  return {
    rawScore,
    totalQuestions,
    percentage,
    bandScore: band,
    cefrLevel,
    skillDescriptorEn: descriptors.en,
    skillDescriptorVi: descriptors.vi,
  };
}
