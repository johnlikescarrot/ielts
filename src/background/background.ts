import { storageService } from '../storage/storageService';
import { getDueCards } from '../srs/srsManager';

// WebExtension background service script for Firefox
export function initializeBackground() {
  if (typeof browser === 'undefined') return;

  // Listen for installation
  if (browser.runtime?.onInstalled) {
    browser.runtime.onInstalled.addListener(() => {
      // Create Context Menus
      if (browser.contextMenus) {
        browser.contextMenus.create({
          id: 'ielts-open-dashboard',
          title: 'Open IELTS Slayer Dashboard',
          contexts: ['action', 'page'],
        });

        browser.contextMenus.create({
          id: 'ielts-lookup-selection',
          title: 'Inspect IELTS Word: "%s"',
          contexts: ['selection'],
        });
      }

      updateReviewBadge();
    });
  }

  // Handle Context Menu Clicks
  if (browser.contextMenus?.onClicked) {
    browser.contextMenus.onClicked.addListener((info: any) => {
      if (info.menuItemId === 'ielts-open-dashboard') {
        browser.tabs.create({ url: browser.runtime.getURL('dashboard.html') });
      } else if (info.menuItemId === 'ielts-lookup-selection') {
        browser.tabs.create({ url: browser.runtime.getURL('dashboard.html') });
      }
    });
  }

  // Handle Runtime Messages
  if (browser.runtime?.onMessage) {
    browser.runtime.onMessage.addListener(async (message: any) => {
      if (message.type === 'SAVE_VOCABULARY') {
        await storageService.addCustomVocabulary(message.data);
        await updateReviewBadge();
        return { success: true };
      }
      if (message.type === 'SAVE_VIDEO_CLIP') {
        await storageService.addVideoClip(message.data);
        return { success: true };
      }
      return false;
    });
  }
}

export async function updateReviewBadge() {
  if (typeof browser === 'undefined' || !browser.action?.setBadgeText) return;

  try {
    const cards = await storageService.getSRSCards();
    const due = getDueCards(cards);
    if (due.length > 0) {
      await browser.action.setBadgeText({ text: String(due.length) });
      if (browser.action.setBadgeBackgroundColor) {
        await browser.action.setBadgeBackgroundColor({ color: '#4f46e5' });
      }
    } else {
      await browser.action.setBadgeText({ text: '' });
    }
  } catch (err) {
    console.warn('Could not update review badge', err);
  }
}

initializeBackground();
