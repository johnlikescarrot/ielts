import { describe, expect, it } from 'vitest';
import { buildYouTubeEmbedUrl, buildYouTubeWatchUrl } from '../../src/shadowing/youTubeEmbed';

describe('buildYouTubeEmbedUrl', () => {
  it('builds a privacy-enhanced chunked embed URL', () => {
    const url = buildYouTubeEmbedUrl('dQw4w9WgXcQ', 12, 24);
    expect(url).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=12&rel=0&modestbranding=1&autoplay=1&end=24',
    );
  });

  it('omits the end parameter for open-ended final chunks', () => {
    const url = buildYouTubeEmbedUrl('abc123XYZ-_', 48, null);
    expect(url).toBe(
      'https://www.youtube-nocookie.com/embed/abc123XYZ-_?start=48&rel=0&modestbranding=1&autoplay=1',
    );
    expect(url).not.toContain('end=');
  });

  it('normalises unsafe time values', () => {
    const url = buildYouTubeEmbedUrl('videoId12345', -4.8, 0.2);
    expect(url).toContain('start=0');
    expect(url).toContain('end=1');
  });

  it('encodes hostile video ids safely', () => {
    const url = buildYouTubeEmbedUrl('a"b?c', 0, null);
    expect(url).toContain('https://www.youtube-nocookie.com/embed/a%22b%3Fc');
  });
});

describe('buildYouTubeWatchUrl', () => {
  it('builds a timestamped watch link', () => {
    expect(buildYouTubeWatchUrl('dQw4w9WgXcQ', 33)).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=33s',
    );
  });

  it('clamps negative timestamps to zero', () => {
    expect(buildYouTubeWatchUrl('dQw4w9WgXcQ', -5)).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=0s',
    );
  });
});
