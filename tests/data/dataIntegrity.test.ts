import { describe, it, expect } from 'vitest';
import { INITIAL_VOCABULARY } from '../../src/data/vocabularyBank';
import { READING_PASSAGES } from '../../src/data/readingTests';
import { LISTENING_SECTIONS } from '../../src/data/listeningTests';
import { WRITING_PROMPTS } from '../../src/data/writingPrompts';
import { SPEAKING_QUESTIONS } from '../../src/data/speakingPrompts';

describe('Data Integrity', () => {
  it('validates vocabulary items structure', () => {
    expect(INITIAL_VOCABULARY.length).toBeGreaterThanOrEqual(10);
    INITIAL_VOCABULARY.forEach(item => {
      expect(item.id).toBeTruthy();
      expect(item.word).toBeTruthy();
      expect(item.phonetic).toBeTruthy();
      expect(item.definitionEn).toBeTruthy();
      expect(item.definitionVi).toBeTruthy();
      expect(item.example).toBeTruthy();
      expect(item.bandScore).toBeGreaterThanOrEqual(7.0);
    });
  });

  it('validates reading passages and questions structure', () => {
    expect(READING_PASSAGES.length).toBeGreaterThanOrEqual(2);
    READING_PASSAGES.forEach(passage => {
      expect(passage.id).toBeTruthy();
      expect(passage.title).toBeTruthy();
      expect(passage.passageText.length).toBeGreaterThan(100);
      expect(passage.questions.length).toBeGreaterThan(0);

      passage.questions.forEach(q => {
        expect(q.id).toBeTruthy();
        expect(q.prompt).toBeTruthy();
        expect(q.correctAnswer).toBeTruthy();
        expect(q.explanationEn).toBeTruthy();
        expect(q.explanationVi).toBeTruthy();
      });
    });
  });

  it('validates listening sections and audio script structure', () => {
    expect(LISTENING_SECTIONS.length).toBeGreaterThanOrEqual(2);
    LISTENING_SECTIONS.forEach(sec => {
      expect(sec.id).toBeTruthy();
      expect(sec.title).toBeTruthy();
      expect(sec.transcript.length).toBeGreaterThan(100);
      expect(sec.questions.length).toBeGreaterThan(0);
      expect(sec.audioScript.length).toBeGreaterThan(0);
    });
  });

  it('validates writing prompts and model essays structure', () => {
    expect(WRITING_PROMPTS.length).toBeGreaterThanOrEqual(2);
    WRITING_PROMPTS.forEach(wp => {
      expect(wp.id).toBeTruthy();
      expect(wp.title).toBeTruthy();
      expect(wp.prompt).toBeTruthy();
      expect(wp.sampleEssayBand9.length).toBeGreaterThan(100);
      expect(wp.keyVocabulary.length).toBeGreaterThan(0);
    });
  });

  it('validates speaking questions structure across all parts', () => {
    expect(SPEAKING_QUESTIONS.length).toBeGreaterThanOrEqual(3);
    const parts = SPEAKING_QUESTIONS.map(q => q.part);
    expect(parts).toContain(1);
    expect(parts).toContain(2);
    expect(parts).toContain(3);

    SPEAKING_QUESTIONS.forEach(sq => {
      expect(sq.id).toBeTruthy();
      expect(sq.topic).toBeTruthy();
      expect(sq.prompt).toBeTruthy();
      expect(sq.modelAnswer.length).toBeGreaterThan(50);
      expect(sq.tipsEn.length).toBeGreaterThan(0);
      expect(sq.tipsVi.length).toBeGreaterThan(0);
    });
  });
});
