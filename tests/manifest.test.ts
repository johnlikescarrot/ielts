import { describe, expect, it } from 'vitest';
import manifest from '../public/manifest.json';

describe('Firefox extension manifest', () => {
  it('uses a Firefox-compatible MV3 service worker', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background).toEqual({ service_worker: 'background.js' });
    expect(manifest.permissions).toContain('storage');
  });

  it('keeps the privacy and bilingual product promise discoverable', () => {
    expect(manifest.description).toMatch(/Free/);
    expect(manifest.description).toMatch(/Privacy-First/);
    expect(manifest.description).toMatch(/Vietnamese/);
  });
});
