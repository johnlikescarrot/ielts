import { describe, expect, it } from 'vitest';
import { cleanTranscript, createVideoLesson } from '../../src/video/videoLesson';

const transcript = `[00:01] Climate researchers analyse complex environmental systems. Their significant research can inform public policy.
00:09 Renewable energy offers substantial benefits, although communities require careful planning. Scientists evaluate evidence and identify practical solutions.
00:18 Governments should establish transparent policies because sustainable development affects future generations. Education can increase awareness and encourage meaningful participation.
00:29 This approach may reduce pollution, improve public health, and create economic opportunities. However, every community must adapt the strategy to local circumstances.`;

describe('video lesson generator', () => {
  it('cleans caption timestamps and whitespace', () => {
    expect(cleanTranscript(' [00:01]  Hello   world.\n01:02 Next line. ')).toBe('Hello world. Next line.');
    expect(cleanTranscript('1 --> 2 First cue.')).toBe('First cue.');
  });

  it('creates a deterministic four-skill lesson', () => {
    const result = createVideoLesson(transcript, 'Climate action');
    expect(result.title).toBe('Climate action');
    expect(result.wordCount).toBeGreaterThanOrEqual(40);
    expect(result.estimatedMinutes).toBe(1);
    expect(result.vocabulary).toHaveLength(8);
    expect(result.cloze.length).toBeGreaterThan(0);
    expect(result.cloze[0].sentence).toContain('________');
    expect(result.speakingPrompts).toHaveLength(3);
    expect(result.writingPrompt).toContain('Climate action');
  });

  it('uses a useful fallback title and validates short transcripts', () => {
    expect(createVideoLesson(transcript, '  ').title).toBe('the ideas in this video');
    expect(() => createVideoLesson('Too short.')).toThrow('at least 40 English words');
  });
});
