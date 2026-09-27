import { describe, expect, it } from 'vitest';
import {
  EVIDENCE_SKILLS,
  IELTS_RESEARCH_REFERENCES,
  buildScholarSearchUrl,
  createScholarCitationKit,
  generateEvidenceStudyPlan,
  getEvidenceReferences,
  summarizeEvidenceCoverage,
} from '../../src/research/evidenceEngine';

describe('evidenceEngine', () => {
  it('builds stable Google Scholar URLs from strings and references', () => {
    expect(buildScholarSearchUrl(' IELTS writing research ')).toBe(
      'https://scholar.google.com/scholar?q=IELTS%20writing%20research'
    );

    expect(buildScholarSearchUrl(IELTS_RESEARCH_REFERENCES[0])).toContain(
      'Averil%20Coxhead%202000'
    );
  });

  it('filters evidence by IELTS skill while preserving all references by default', () => {
    expect(getEvidenceReferences()).toHaveLength(IELTS_RESEARCH_REFERENCES.length);

    const writingRefs = getEvidenceReferences('writing');
    expect(writingRefs.length).toBeGreaterThan(0);
    expect(writingRefs.every(reference => reference.skills.includes('writing'))).toBe(true);
  });

  it('summarizes coverage with deterministic skill counts, year range and top tags', () => {
    const summary = summarizeEvidenceCoverage();

    expect(summary.totalReferences).toBe(IELTS_RESEARCH_REFERENCES.length);
    expect(summary.yearRange).toBe('1998-2009');
    EVIDENCE_SKILLS.forEach(skill => {
      expect(summary.bySkill[skill]).toBeGreaterThan(0);
    });
    expect(summary.topTags).toContain('Academic Word List');

    expect(summarizeEvidenceCoverage([])).toEqual({
      totalReferences: 0,
      bySkill: {
        reading: 0,
        listening: 0,
        writing: 0,
        speaking: 0,
        vocabulary: 0,
      },
      yearRange: 'n/a',
      topTags: [],
    });
  });

  it('creates English and Vietnamese Scholar citation kits', () => {
    const enKit = createScholarCitationKit('en');
    const viKit = createScholarCitationKit('vi');

    expect(enKit).toContain('# IELTS Slayer Research Evidence Kit');
    expect(enKit).toContain('Google Scholar');
    expect(enKit).toContain('https://scholar.google.com/scholar?q=');
    expect(viKit).toContain('# Bộ nguồn nghiên cứu IELTS Slayer');
    expect(viKit).toContain('Các nguồn dưới đây');
  });

  it('generates bounded evidence plans with default and custom priorities', () => {
    const defaultPlan = generateEvidenceStudyPlan({ targetBand: 10, weeklyMinutes: 10 });
    expect(defaultPlan).toHaveLength(EVIDENCE_SKILLS.length);
    expect(defaultPlan.reduce((sum, item) => sum + item.minutes, 0)).toBe(30);
    expect(defaultPlan[0].rationale).toContain('Band 9.0');

    const viPlan = generateEvidenceStudyPlan({
      targetBand: 3,
      weeklyMinutes: 151,
      prioritySkills: ['writing', 'speaking'],
      language: 'vi',
    });
    expect(viPlan).toHaveLength(2);
    expect(viPlan.map(item => item.minutes)).toEqual([76, 75]);
    expect(viPlan[0].rationale).toContain('Band 4.0');
    expect(viPlan[0].rationale).toContain('phút/tuần');
  });
});
