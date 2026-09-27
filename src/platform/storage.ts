import { PracticeRepository, type StorageDriver } from '../core/repository';

class BrowserStorageDriver implements StorageDriver {
  public constructor(private readonly area: browser.storage.StorageArea) {}

  public async read(key: string): Promise<unknown> {
    const values = await this.area.get(key);
    return values[key];
  }

  public async write(key: string, value: unknown): Promise<void> {
    await this.area.set({ [key]: value });
  }
}

class LocalStorageDriver implements StorageDriver {
  public read(key: string): Promise<unknown> {
    const serialized = localStorage.getItem(key);
    if (serialized === null) return Promise.resolve(null);
    try {
      return Promise.resolve(JSON.parse(serialized) as unknown);
    } catch {
      return Promise.resolve(null);
    }
  }

  public write(key: string, value: unknown): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
    return Promise.resolve();
  }
}

export function createStorageDriver(): StorageDriver {
  return typeof browser === 'undefined'
    ? new LocalStorageDriver()
    : new BrowserStorageDriver(browser.storage.local);
}

export const practiceRepository = new PracticeRepository(createStorageDriver());
