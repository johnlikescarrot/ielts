import { describe, it, expect } from 'vitest';
import {
  calculateListeningBand,
  calculateReadingBand,
  calculateOverallBand,
  getCEFRLevel,
  getBandDescriptor,
  getScoreBreakdown
} from '../../src/calculator/bandCalculator';

describe('bandCalculator', () => {
  it('calculates listening band accurately across all score tiers', () => {
    expect(calculateListeningBand(40)).toBe(9.0);
    expect(calculateListeningBand(39)).toBe(9.0);
    expect(calculateListeningBand(37)).toBe(8.5);
    expect(calculateListeningBand(35)).toBe(8.0);
    expect(calculateListeningBand(33)).toBe(7.5);
    expect(calculateListeningBand(30)).toBe(7.0);
    expect(calculateListeningBand(27)).toBe(6.5);
    expect(calculateListeningBand(24)).toBe(6.0);
    expect(calculateListeningBand(20)).toBe(5.5);
    expect(calculateListeningBand(16)).toBe(5.0);
    expect(calculateListeningBand(14)).toBe(4.5);
    expect(calculateListeningBand(11)).toBe(4.0);
    expect(calculateListeningBand(8)).toBe(3.5);
    expect(calculateListeningBand(6)).toBe(3.0);
    expect(calculateListeningBand(4)).toBe(2.5);
    expect(calculateListeningBand(2)).toBe(2.0);
    expect(calculateListeningBand(0)).toBe(1.0);
  });

  it('calculates academic reading band accurately', () => {
    expect(calculateReadingBand(40, 40, 'academic')).toBe(9.0);
    expect(calculateReadingBand(38, 40, 'academic')).toBe(8.5);
    expect(calculateReadingBand(35, 40, 'academic')).toBe(8.0);
    expect(calculateReadingBand(33, 40, 'academic')).toBe(7.5);
    expect(calculateReadingBand(30, 40, 'academic')).toBe(7.0);
    expect(calculateReadingBand(27, 40, 'academic')).toBe(6.5);
    expect(calculateReadingBand(24, 40, 'academic')).toBe(6.0);
    expect(calculateReadingBand(20, 40, 'academic')).toBe(5.5);
    expect(calculateReadingBand(16, 40, 'academic')).toBe(5.0);
    expect(calculateReadingBand(13, 40, 'academic')).toBe(4.5);
    expect(calculateReadingBand(10, 40, 'academic')).toBe(4.0);
    expect(calculateReadingBand(8, 40, 'academic')).toBe(3.5);
    expect(calculateReadingBand(6, 40, 'academic')).toBe(3.0);
    expect(calculateReadingBand(4, 40, 'academic')).toBe(2.5);
    expect(calculateReadingBand(2, 40, 'academic')).toBe(2.0);
    expect(calculateReadingBand(0, 40, 'academic')).toBe(1.0);
  });

  it('calculates general training reading band accurately', () => {
    expect(calculateReadingBand(40, 40, 'general')).toBe(9.0);
    expect(calculateReadingBand(39, 40, 'general')).toBe(8.5);
    expect(calculateReadingBand(38, 40, 'general')).toBe(8.0);
    expect(calculateReadingBand(36, 40, 'general')).toBe(7.5);
    expect(calculateReadingBand(34, 40, 'general')).toBe(7.0);
    expect(calculateReadingBand(32, 40, 'general')).toBe(6.5);
    expect(calculateReadingBand(30, 40, 'general')).toBe(6.0);
    expect(calculateReadingBand(27, 40, 'general')).toBe(5.5);
    expect(calculateReadingBand(23, 40, 'general')).toBe(5.0);
    expect(calculateReadingBand(19, 40, 'general')).toBe(4.5);
    expect(calculateReadingBand(15, 40, 'general')).toBe(4.0);
    expect(calculateReadingBand(12, 40, 'general')).toBe(3.5);
    expect(calculateReadingBand(9, 40, 'general')).toBe(3.0);
    expect(calculateReadingBand(6, 40, 'general')).toBe(2.5);
    expect(calculateReadingBand(2, 40, 'general')).toBe(2.0);
    expect(calculateReadingBand(0, 40, 'general')).toBe(1.0);
  });

  it('calculates overall composite band with IELTS rounding rules', () => {
    // Exact match
    expect(calculateOverallBand({ listening: 7.0, reading: 7.0, writing: 7.0, speaking: 7.0 })).toBe(7.0);

    // Fraction = 0.25 -> rounds up to 0.5 (e.g. (6.5 + 6.5 + 7.0 + 7.0) / 4 = 6.75 -> 7.0)
    expect(calculateOverallBand({ listening: 6.5, reading: 6.5, writing: 7.0, speaking: 7.0 })).toBe(7.0);
    // (6.0 + 6.0 + 6.5 + 6.5) / 4 = 6.25 -> 6.5
    expect(calculateOverallBand({ listening: 6.0, reading: 6.0, writing: 6.5, speaking: 6.5 })).toBe(6.5);

    // Fraction = 0.125 -> rounds down to .0 ((6.5 + 6.5 + 6.5 + 7.0) / 4 = 6.625 -> 6.5)
    expect(calculateOverallBand({ listening: 6.5, reading: 6.5, writing: 6.5, speaking: 7.0 })).toBe(6.5);

    // Empty or invalid input
    expect(calculateOverallBand({})).toBe(0);
  });

  it('maps CEFR level and band descriptors', () => {
    expect(getCEFRLevel(9.0)).toBe('C2');
    expect(getCEFRLevel(8.5)).toBe('C2');
    expect(getCEFRLevel(7.5)).toBe('C1');
    expect(getCEFRLevel(6.5)).toBe('B2');
    expect(getCEFRLevel(4.5)).toBe('B1');
    expect(getCEFRLevel(3.0)).toBe('A2');

    expect(getBandDescriptor(9.0).en).toContain('Expert User');
    expect(getBandDescriptor(8.0).en).toContain('Very Good User');
    expect(getBandDescriptor(7.0).en).toContain('Good User');
    expect(getBandDescriptor(6.0).en).toContain('Competent User');
    expect(getBandDescriptor(5.0).en).toContain('Modest User');
    expect(getBandDescriptor(3.0).en).toContain('Limited User');
  });

  it('generates full score breakdown report', () => {
    const readingReport = getScoreBreakdown('reading', 35, 40, 'academic');
    expect(readingReport.bandScore).toBe(8.0);
    expect(readingReport.percentage).toBe(88);
    expect(readingReport.cefrLevel).toBe('C1');

    const listeningReport = getScoreBreakdown('listening', 38, 40);
    expect(listeningReport.bandScore).toBe(8.5);

    const otherReport = getScoreBreakdown('writing', 7.5, 9);
    expect(otherReport.bandScore).toBe(7.5);

    // Test clamped bounds for other skills (max 9.0)
    const writingReportHigh = getScoreBreakdown('writing', 10, 9);
    expect(writingReportHigh.bandScore).toBe(9.0);

    // Test clamped bounds for other skills (min 1.0)
    const writingReportLow = getScoreBreakdown('writing', 0, 9);
    expect(writingReportLow.bandScore).toBe(1.0);

    // Test invalid skill defaults to clamped raw score
    const invalidSkillReport = getScoreBreakdown('invalid-skill' as any, 5.5, 9);
    expect(invalidSkillReport.bandScore).toBe(5.5);
  });
});
