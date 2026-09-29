import { describe, it, expect } from 'vitest';
import { SHADOWING_PRESETS } from '../../src/data/shadowingPresets';
import { parseSrtOrVtt } from '../../src/video/subtitleParser';

describe('shadowingPresets data', () => {
  it('contains valid and complete curated presets', () => {
    expect(SHADOWING_PRESETS.length).toBeGreaterThanOrEqual(5);

    for (const preset of SHADOWING_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.title).toBeTruthy();
      expect(['speaking', 'listening']).toContain(preset.skillType);
      expect(preset.bandScore).toBeGreaterThanOrEqual(7.0);
      expect(preset.descriptionEn).toBeTruthy();
      expect(preset.descriptionVi).toBeTruthy();
      expect(preset.subtitles.length).toBeGreaterThan(20);

      const parsedCues = parseSrtOrVtt(preset.subtitles);
      expect(parsedCues.length).toBeGreaterThan(0);
    }
  });
});
