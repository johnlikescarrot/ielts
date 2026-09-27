/**
 * The extension's privacy contract is deliberately executable so changes to
 * permissions and storage behaviour can be reviewed and tested.
 */
export const PRIVACY_POLICY = Object.freeze({
  networkAccess: false,
  requiresAccount: false,
  usesAdvertising: false,
  storesDataLocally: true,
  collectsTelemetry: false,
  supportsExport: true,
} as const);

export interface PrivacyPolicy {
  networkAccess: boolean;
  requiresAccount: boolean;
  usesAdvertising: boolean;
  storesDataLocally: boolean;
  collectsTelemetry: boolean;
  supportsExport: boolean;
}

export function getPrivacySummary(policy: PrivacyPolicy = PRIVACY_POLICY): string[] {
  return [
    policy.networkAccess ? 'Network access may be used.' : 'No network access is required.',
    policy.requiresAccount ? 'An account is required.' : 'No account or login is required.',
    policy.usesAdvertising ? 'Advertising may be shown.' : 'No advertising is shown.',
    policy.storesDataLocally ? 'Learning data stays in Firefox local storage.' : 'Learning data may leave the browser.',
    policy.collectsTelemetry ? 'Anonymous telemetry is collected.' : 'No telemetry is collected.',
    policy.supportsExport ? 'Users can export and restore their data.' : 'Data export is unavailable.',
  ];
}

export function isPrivacyFirst(policy: PrivacyPolicy = PRIVACY_POLICY): boolean {
  return !policy.networkAccess && !policy.requiresAccount && !policy.usesAdvertising &&
    policy.storesDataLocally && !policy.collectsTelemetry && policy.supportsExport;
}
