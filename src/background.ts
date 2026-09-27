import browser from "webextension-polyfill";

const menuId = "ielts-compass-save-selection";
void browser.runtime.onInstalled.addListener(() => {
  void browser.contextMenus.create({
    id: menuId,
    title: "Save “%s” to IELTS Compass",
    contexts: ["selection"],
  });
});
void browser.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === menuId && info.selectionText)
    await browser.storage.local.set({ pendingCapture: info.selectionText });
});
const openCompass = async () =>
  browser.tabs.create({ url: browser.runtime.getURL("index.html") });
void browser.action.onClicked.addListener(openCompass);
void browser.commands.onCommand.addListener(async (command) => {
  if (command === "open-compass") await openCompass();
});
