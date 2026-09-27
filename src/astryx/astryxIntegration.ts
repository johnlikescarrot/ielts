/**
 * Lightweight Astryx integration contract.
 *
 * The project stays on React 18 for Firefox extension compatibility, so we do
 * not bundle @astryxdesign/core (React 19 peer dependency) at runtime. We still
 * use the public facebook/astryx agent-ready design guidance via the CLI during
 * development and keep this source of truth available to product modules.
 */
export const ASTRYX_REFERENCE = {
  source: 'https://github.com/facebook/astryx',
  cliPackage: '@astryxdesign/cli@0.6.3',
  command: 'npx --yes @astryxdesign/cli@0.6.3 docs principles --detail compact',
  principles: [
    'frame-first page layout',
    'semantic tokens over hard-coded values',
    'controlled form inputs',
    'dense educational data as rows and sections',
  ],
} as const;

export type AstryxReference = typeof ASTRYX_REFERENCE;
