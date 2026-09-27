import { mergeConfig, defineConfig } from 'vitest/config';
import baseConfig from './vitest.config';

/**
 * The deterministic transcript engine is the privacy-critical core of Video
 * Study Studio. Keep its statement, branch, function, and line coverage at 100%.
 */
export default mergeConfig(baseConfig, defineConfig({
  test: {
    coverage: {
      include: ['src/video/transcriptStudio.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
}));
