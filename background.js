browser.runtime.onInstalled.addListener(() => browser.storage.local.set({ installedAt: new Date().toISOString() }));
