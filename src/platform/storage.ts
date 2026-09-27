import { EMPTY_DATA, type AppData } from "../lib/model";

const KEY = "ieltsForgeData";

export async function loadData(): Promise<AppData> {
  if (typeof browser !== "undefined" && browser.storage) {
    const stored = await browser.storage.local.get(KEY);
    return (stored[KEY] as AppData | undefined) ?? structuredClone(EMPTY_DATA);
  }
  const raw = localStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as AppData) : structuredClone(EMPTY_DATA);
}

export async function saveData(data: AppData): Promise<void> {
  if (typeof browser !== "undefined" && browser.storage) {
    await browser.storage.local.set({ [KEY]: data });
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(data));
}

export async function readActiveSelection(): Promise<{
  text: string;
  context: string;
  title: string;
  url: string;
}> {
  if (typeof browser === "undefined" || !browser.tabs) {
    return { text: "", context: "", title: "Preview page", url: location.href };
  }
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id)
    return {
      text: "",
      context: "",
      title: tab?.title ?? "",
      url: tab?.url ?? "",
    };
  const captureSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    const container = selection?.anchorNode?.parentElement;
    const context =
      container?.closest("p, li, blockquote, article")?.textContent?.trim() ??
      text;
    return {
      text,
      context: context.slice(0, 500),
      title: document.title,
      url: location.href,
    };
  };
  // Firefox's published WebExtension types still constrain injected functions to void.
  const results = (await browser.scripting.executeScript({
    target: { tabId: tab.id },
    func: captureSelection as () => void,
  })) as unknown as Array<{ result?: ReturnType<typeof captureSelection> }>;
  return (
    results[0]?.result ?? {
      text: "",
      context: "",
      title: tab.title ?? "",
      url: tab.url ?? "",
    }
  );
}
