/**
 * Privacy-preserving YouTube chunk playback.
 *
 * The reference Shadow Player controls YouTube via the IFrame Player API,
 * which loads a remote script. Firefox add-on policy forbids remotely hosted
 * code and IELTS Slayer promises no third-party scripts, so chunked playback
 * is achieved with plain embed URLs instead: each replay re-embeds the video
 * with `start`/`end` parameters (and the privacy-enhanced `youtube-nocookie`
 * domain), and the embedded player stops itself at the chunk boundary.
 */

export function buildYouTubeEmbedUrl(
  videoId: string,
  startSeconds: number,
  endSeconds: number | null,
): string {
  const params = new URLSearchParams({
    start: String(Math.max(0, Math.floor(startSeconds))),
    rel: '0',
    modestbranding: '1',
    autoplay: '1',
  });
  if (endSeconds !== null) {
    params.set('end', String(Math.max(1, Math.floor(endSeconds))));
  }
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
}

export function buildYouTubeWatchUrl(videoId: string, startSeconds: number): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&t=${Math.max(0, Math.floor(startSeconds))}s`;
}
