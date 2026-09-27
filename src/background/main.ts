import { dueCards } from '../core/selectors';
import type { CaptureInput } from '../core/types';
import { practiceRepository } from '../platform/storage';

const MENU_ID = 'ielts-forge-capture';

async function updateBadge(): Promise<void> {
  const state = await practiceRepository.load();
  const count = dueCards(state.cards, new Date()).length;
  await browser.action.setBadgeBackgroundColor({ color: '#ffb020' });
  await browser.action.setBadgeText({ text: count === 0 ? '' : String(count) });
}

browser.runtime.onInstalled.addListener(() => {
  void browser.contextMenus.removeAll().then(() => {
    browser.contextMenus.create({
      id: MENU_ID,
      title: 'Save selection to IELTS Forge',
      contexts: ['selection'],
    });
  });
  void updateBadge();
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const input: CaptureInput = {
    prompt: info.selectionText,
    context: info.selectionText,
    skill: 'reading',
    source: { title: tab?.title ?? '', url: info.pageUrl ?? tab?.url ?? '' },
  };
  void practiceRepository.capture(input).then(updateBadge);
});

browser.storage.onChanged.addListener((_changes, areaName) => {
  if (areaName === 'local') void updateBadge();
});

void updateBadge();
