import { describe, expect, it } from 'vitest';
import manifest from '../public/manifest.json';
import enMessages from '../public/_locales/en/messages.json';
import viMessages from '../public/_locales/vi/messages.json';

describe('Firefox extension manifest', () => {
  it('uses a Firefox-compatible MV3 service worker', () => {
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.background).toEqual({ service_worker: 'background.js' });
    expect(manifest.permissions).toContain('storage');
  });

  it('keeps the privacy and bilingual product promise discoverable through localized messages', () => {
    expect(manifest.default_locale).toBe('en');
    expect(manifest.description).toBe('__MSG_extensionDescription__');
    expect(enMessages.extensionDescription.message).toMatch(/free/i);
    expect(enMessages.extensionDescription.message).toMatch(/privacy-first/i);
    expect(enMessages.extensionDescription.message).toMatch(/English\/Vietnamese/i);
    expect(viMessages.extensionDescription.message).toMatch(/miễn phí/i);
    expect(viMessages.extensionDescription.message).toMatch(/Anh\/Việt/i);
  });
});
