const SPACE_PATTERN = /\s+/gu;

export function normalizeText(value: string, maximumLength = 500): string {
  return value.trim().replace(SPACE_PATTERN, ' ').slice(0, maximumLength);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

export function createCloze(context: string, prompt: string): string {
  const cleanContext = normalizeText(context);
  const cleanPrompt = normalizeText(prompt);
  if (cleanContext === '' || cleanPrompt === '') return cleanPrompt;

  const pattern = new RegExp(escapeRegExp(cleanPrompt), 'iu');
  return pattern.test(cleanContext) ? cleanContext.replace(pattern, '_____') : cleanPrompt;
}

export function safeHttpUrl(value: string): string {
  const normalized = normalizeText(value, 1_500);
  if (normalized === '') return '';
  try {
    const url = new URL(normalized);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

export function cardFingerprint(prompt: string, context: string, sourceUrl: string): string {
  return [prompt, context, sourceUrl]
    .map((value) => normalizeText(value).toLocaleLowerCase())
    .join('|');
}
