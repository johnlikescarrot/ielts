import { addCard } from './domain/scheduler';
import { loadState, saveState } from './platform/storage';

const MENU_ID = 'focus-ielts-capture-selection';

async function install(): Promise<void> {
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({
    id: MENU_ID,
    title: 'Save “%s” to Focus IELTS',
    contexts: ['selection']
  });
  await loadState();
}

browser.runtime.onInstalled.addListener(() => {
  void install();
});

browser.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) {
    return;
  }
  void captureSelection(info.selectionText);
});

async function captureSelection(selection: string): Promise<void> {
  const state = await loadState();
  const next = addCard(
    state,
    {
      front: selection,
      back: 'Add your own meaning in Focus IELTS Studio.',
      context: '',
      tags: ['Captured']
    },
    new Date()
  );
  await saveState(next);
}
