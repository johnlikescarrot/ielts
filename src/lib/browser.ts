export interface SelectionResult {
  text: string;
  title: string;
  url: string;
}

export async function captureActiveSelection(): Promise<SelectionResult> {
  if (typeof browser === 'undefined') {
    return {
      text: window.getSelection()?.toString() ?? '',
      title: document.title,
      url: location.href,
    };
  }
  const [tab] = await browser.tabs.query({active: true, currentWindow: true});
  if (tab.id === undefined)
    return {text: '', title: tab.title ?? '', url: tab.url ?? ''};
  const readSelection = () => ({
    text: globalThis.getSelection()?.toString() ?? '',
    title: globalThis.document.title,
    url: globalThis.location.href,
  });
  const results = await browser.scripting.executeScript({
    target: {tabId: tab.id},
    func: readSelection as () => void,
  });
  return (
    (results[0]?.result as SelectionResult | undefined) ?? {
      text: '',
      title: tab.title ?? '',
      url: tab.url ?? '',
    }
  );
}

export async function openDashboard(): Promise<void> {
  if (typeof browser === 'undefined') {
    window.open('/index.html', '_self');
    return;
  }
  await browser.runtime.openOptionsPage();
}

export function downloadBackup(contents: string, filename: string): void {
  const url = URL.createObjectURL(
    new Blob([contents], {type: 'application/json'}),
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
