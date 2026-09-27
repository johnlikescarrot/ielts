import { describe, expect, it } from 'vitest';
import { getPrivacySummary, isPrivacyFirst, PRIVACY_POLICY } from '../../src/privacy/privacyPolicy';

describe('privacy policy', () => {
  it('documents the offline, no-login product contract', () => {
    expect(isPrivacyFirst()).toBe(true);
    expect(PRIVACY_POLICY).toMatchObject({
      networkAccess: false,
      requiresAccount: false,
      collectsTelemetry: false,
      storesDataLocally: true,
    });
    expect(getPrivacySummary()).toHaveLength(6);
  });

  it('makes a changed policy visible instead of silently calling it private', () => {
    const policy = { ...PRIVACY_POLICY, networkAccess: true };
    expect(isPrivacyFirst(policy)).toBe(false);
    expect(getPrivacySummary(policy)[0]).toContain('may be used');
  });
});
