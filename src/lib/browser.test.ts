import {describe, expect, it, vi} from 'vitest';
import {captureActiveSelection, downloadBackup, openDashboard} from './browser';

describe('browser helpers', () => {
  it('captures the current document selection in preview mode', async () => {
    document.title = 'Preview';
    vi.spyOn(window, 'getSelection').mockReturnValue({
      toString: () => 'selected',
    } as Selection);
    expect(await captureActiveSelection()).toMatchObject({
      text: 'selected',
      title: 'Preview',
    });
    vi.mocked(window.getSelection).mockReturnValue(null);
    expect((await captureActiveSelection()).text).toBe('');
  });

  it('captures active tab selections with fallback paths', async () => {
    document.title = 'Page';
    vi.spyOn(window, 'getSelection').mockReturnValue({
      toString: () => 'word',
    } as Selection);
    const executeScript = vi.fn(async ({func}: {func: () => unknown}) => [
      {result: func()},
    ]);
    const query = vi.fn<
      () => Promise<{id?: number; title?: string; url?: string}[]>
    >(async () => [{id: 7, title: 'Tab', url: 'https://tab'}]);
    vi.stubGlobal('browser', {
      tabs: {query},
      scripting: {executeScript},
      runtime: {openOptionsPage: vi.fn()},
    });
    expect(await captureActiveSelection()).toEqual({
      text: 'word',
      title: 'Page',
      url: window.location.href,
    });
    expect(executeScript).toHaveBeenCalledWith(
      expect.objectContaining({target: {tabId: 7}, func: expect.any(Function)}),
    );
    vi.mocked(window.getSelection).mockReturnValue(null);
    expect((await captureActiveSelection()).text).toBe('');

    executeScript.mockResolvedValueOnce([]);
    expect(await captureActiveSelection()).toEqual({
      text: '',
      title: 'Tab',
      url: 'https://tab',
    });
    query.mockResolvedValueOnce([{id: 8, title: undefined, url: undefined}]);
    executeScript.mockResolvedValueOnce([]);
    expect(await captureActiveSelection()).toEqual({
      text: '',
      title: '',
      url: '',
    });
    query.mockResolvedValueOnce([{title: undefined, url: undefined}]);
    expect(await captureActiveSelection()).toEqual({
      text: '',
      title: '',
      url: '',
    });
  });

  it('opens extension options or preview dashboard', async () => {
    const openOptionsPage = vi.fn(async () => undefined);
    vi.stubGlobal('browser', {runtime: {openOptionsPage}});
    await openDashboard();
    expect(openOptionsPage).toHaveBeenCalled();
    vi.unstubAllGlobals();
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    await openDashboard();
    expect(open).toHaveBeenCalledWith('/index.html', '_self');
  });

  it('downloads and revokes a generated backup URL', () => {
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    downloadBackup('{}', 'backup.json');
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
  });
});
