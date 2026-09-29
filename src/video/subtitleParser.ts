export interface SubtitleCue {
  id: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

const TIME_MS_PATTERN = /^(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?$/;

/**
 * Parses timestamp string (e.g. "00:01:23,456" or "01:23.456" or "83") into seconds with millisecond precision.
 */
export function parseSubtitleTimestamp(timestamp: string): number | null {
  const trimmed = timestamp.trim();
  if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  const match = trimmed.match(TIME_MS_PATTERN);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2]);
  const seconds = Number(match[3]);
  const msPart = match[4] ? Number(match[4].padEnd(3, '0').slice(0, 3)) : 0;

  if (minutes > 59 || seconds > 59) return null;
  return hours * 3600 + minutes * 60 + seconds + msPart / 1000;
}

/**
 * Strips HTML tags, WebVTT styles, SSA/ASS tags, and normalizes whitespaces.
 */
export function cleanSubtitleText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, '') // remove HTML tags like <b>, <i>, <c.color>
    .replace(/\{\\[^}]+\}/g, '') // remove ASS/SSA override tags like {\an8}
    .replace(/\[\/?(?:b|i|u|color|font)[^\]]*\]/gi, '') // remove BBCode style tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses SRT or VTT subtitle text into an array of structured SubtitleCue objects.
 */
export function parseSrtOrVtt(content: string): SubtitleCue[] {
  if (!content || !content.trim()) return [];

  // Remove WEBVTT header if present
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  const cues: SubtitleCue[] = [];
  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  let currentTextLines: string[] = [];

  const flushCue = () => {
    if (currentStart !== null && currentTextLines.length > 0) {
      const text = cleanSubtitleText(currentTextLines.join(' '));
      if (text) {
        const start = currentStart;
        const end = currentEnd !== null && currentEnd > start ? currentEnd : start + Math.max(3, Math.min(10, text.split(' ').length * 0.5));
        cues.push({
          id: `cue-${cues.length + 1}`,
          startSeconds: Math.round(start * 100) / 100,
          endSeconds: Math.round(end * 100) / 100,
          text,
        });
      }
    }
    currentStart = null;
    currentEnd = null;
    currentTextLines = [];
  };

  const timeRangeRegex = /((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\s*-->\s*((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushCue();
      continue;
    }

    // Skip WEBVTT signature, NOTE blocks, or numerical cue indices
    if (line.startsWith('WEBVTT') || line.startsWith('NOTE') || /^\d+$/.test(line)) {
      continue;
    }

    const rangeMatch = line.match(timeRangeRegex);
    if (rangeMatch) {
      flushCue();
      currentStart = parseSubtitleTimestamp(rangeMatch[1]);
      currentEnd = parseSubtitleTimestamp(rangeMatch[2]);
      continue;
    }

    // Bracketed timestamp line e.g. [01:23] or (01:23) or 01:23 - Text
    const bracketMatch = line.match(/^\[?((?:\d{1,2}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)\]?\s*[-–—]?\s*(.*)$/);
    if (bracketMatch) {
      const start = parseSubtitleTimestamp(bracketMatch[1]);
      if (start !== null) {
        flushCue();
        currentStart = start;
        if (bracketMatch[2]) {
          currentTextLines.push(bracketMatch[2]);
        }
        continue;
      }
    }

    // Regular subtitle text line
    if (currentStart !== null) {
      currentTextLines.push(line);
    } else {
      // Line without explicit timestamp; estimate start time based on previous cue
      const lastCue = cues[cues.length - 1];
      const start = lastCue ? lastCue.endSeconds : 0;
      currentStart = start;
      currentTextLines.push(line);
    }
  }

  flushCue();
  return cues;
}

/**
 * Formats seconds into standard SRT timestamp HH:MM:SS,mmm
 */
export function formatSrtTimestamp(seconds: number): string {
  const safe = Math.max(0, seconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const ms = Math.floor((safe % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

/**
 * Exports subtitle cues back to standard SRT format.
 */
export function exportToSrt(cues: SubtitleCue[]): string {
  return cues
    .map((cue, index) => {
      const start = formatSrtTimestamp(cue.startSeconds);
      const end = formatSrtTimestamp(cue.endSeconds);
      return `${index + 1}\n${start} --> ${end}\n${cue.text}\n`;
    })
    .join('\n');
}
