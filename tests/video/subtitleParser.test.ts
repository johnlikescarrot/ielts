import { describe, it, expect } from 'vitest';
import {
  parseSubtitleTimestamp,
  cleanSubtitleText,
  parseSrtOrVtt,
  formatSrtTimestamp,
  exportToSrt,
} from '../../src/video/subtitleParser';

describe('subtitleParser', () => {
  describe('parseSubtitleTimestamp', () => {
    it('parses raw float seconds', () => {
      expect(parseSubtitleTimestamp('12.345')).toBe(12.345);
      expect(parseSubtitleTimestamp('80')).toBe(80);
    });

    it('parses HH:MM:SS,mmm and HH:MM:SS.mmm format', () => {
      expect(parseSubtitleTimestamp('01:02:03,500')).toBe(3723.5);
      expect(parseSubtitleTimestamp('00:01:30.250')).toBe(90.25);
      expect(parseSubtitleTimestamp('02:15')).toBe(135);
    });

    it('returns null for invalid timestamps', () => {
      expect(parseSubtitleTimestamp('invalid')).toBeNull();
      expect(parseSubtitleTimestamp('00:65:20')).toBeNull(); // minutes > 59
      expect(parseSubtitleTimestamp('00:10:99')).toBeNull(); // seconds > 59
    });
  });

  describe('cleanSubtitleText', () => {
    it('strips html and formatting tags', () => {
      expect(cleanSubtitleText('<b>Hello</b> <font color="red">world</font>')).toBe('Hello world');
      expect(cleanSubtitleText('{\\an8}Top caption text')).toBe('Top caption text');
      expect(cleanSubtitleText('[b]BBCode[/b] [color=blue]test[/color]')).toBe('BBCode test');
    });

    it('decodes html entities and normalizes whitespace', () => {
      expect(cleanSubtitleText('Tom &amp; Jerry &lt;3 &quot;cartoons&quot; &nbsp;')).toBe('Tom & Jerry <3 "cartoons"');
    });
  });

  describe('parseSrtOrVtt', () => {
    it('returns empty array for empty or blank input', () => {
      expect(parseSrtOrVtt('')).toEqual([]);
      expect(parseSrtOrVtt('   \n  ')).toEqual([]);
    });

    it('parses standard SRT format with multiple cues', () => {
      const srt = `1
00:00:01,000 --> 00:00:04,500
First subtitle line

2
00:00:05,000 --> 00:00:08,200
Second subtitle line
With multiple rows`;

      const cues = parseSrtOrVtt(srt);
      expect(cues).toHaveLength(2);
      expect(cues[0]).toEqual({
        id: 'cue-1',
        startSeconds: 1,
        endSeconds: 4.5,
        text: 'First subtitle line',
      });
      expect(cues[1].text).toBe('Second subtitle line With multiple rows');
    });

    it('parses WebVTT content with headers and notes', () => {
      const vtt = `WEBVTT
NOTE This is a test comment

00:01.000 --> 00:04.000
WebVTT cue text

00:05.500 --> 00:09.000
Another WebVTT cue`;

      const cues = parseSrtOrVtt(vtt);
      expect(cues).toHaveLength(2);
      expect(cues[0].text).toBe('WebVTT cue text');
      expect(cues[1].startSeconds).toBe(5.5);
    });

    it('parses bracketed timestamp transcript lines', () => {
      const transcript = `[00:00] First segment here
[00:10] - Second segment following`;

      const cues = parseSrtOrVtt(transcript);
      expect(cues).toHaveLength(2);
      expect(cues[0].startSeconds).toBe(0);
      expect(cues[1].startSeconds).toBe(10);
    });

    it('parses bracketed timestamp alone on its line followed by text', () => {
      const transcript = `[00:05]
Segment text on next line
[00:15]
Another segment`;

      const cues = parseSrtOrVtt(transcript);
      expect(cues.length).toBe(2);
      expect(cues[0].startSeconds).toBe(5);
    });

    it('handles lines without timestamps by chaining to previous cue', () => {
      const untimed = `Line one of dialogue
Line two of dialogue`;

      const cues = parseSrtOrVtt(untimed);
      expect(cues.length).toBeGreaterThan(0);
    });
  });

  describe('formatSrtTimestamp & exportToSrt', () => {
    it('formats seconds to SRT timestamp format', () => {
      expect(formatSrtTimestamp(3661.123)).toBe('01:01:01,123');
      expect(formatSrtTimestamp(0)).toBe('00:00:00,000');
    });

    it('exports cues array back to valid SRT text', () => {
      const cues = [
        { id: 'c1', startSeconds: 1.5, endSeconds: 4.2, text: 'Hello IELTS' },
        { id: 'c2', startSeconds: 5.0, endSeconds: 9.0, text: 'Shadowing practice' },
      ];
      const exported = exportToSrt(cues);
      expect(exported).toContain('1\n00:00:01,500 --> 00:00:04,200\nHello IELTS');
      expect(exported).toContain('2\n00:00:05,000 --> 00:00:09,000\nShadowing practice');
    });
  });
});
