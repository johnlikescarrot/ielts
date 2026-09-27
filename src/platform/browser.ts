export interface PageContext {
  selection: string;
  title: string;
  url: string;
}

export async function getActivePageContext(): Promise<PageContext> {
  if (typeof browser === 'undefined') return { selection: '', title: '', url: '' };

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) {
    return { selection: '', title: tab?.title ?? '', url: tab?.url ?? '' };
  }

  let selection = '';
  try {
    const results = (await browser.scripting.executeScript({
      target: { tabId: tab.id },
      func: (() => window.getSelection()?.toString() ?? '') as () => void,
    })) as unknown as { result?: unknown }[];
    selection = typeof results[0]?.result === 'string' ? results[0].result : '';
  } catch {
    // Protected Firefox pages intentionally deny script injection.
  }

  return { selection, title: tab.title ?? '', url: tab.url ?? '' };
}

export async function openDashboard(): Promise<void> {
  if (typeof browser === 'undefined') {
    window.location.assign('/dashboard.html');
    return;
  }
  await browser.tabs.create({ url: browser.runtime.getURL('dashboard.html') });
  window.close();
}

export function downloadText(filename: string, contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
