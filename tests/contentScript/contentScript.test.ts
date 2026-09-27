import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleSelection,
  initializeVideoStudyPanel,
  lookupWord,
  mountVideoStudyPanel,
  removeTooltip,
  removeVideoStudyPanel,
} from '../../src/contentScript/contentScript';

describe('contentScript Suite', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    removeTooltip();
    removeVideoStudyPanel();
  });

  it('looks up words in vocabulary bank and academic word list', () => {
    const vocabMatch = lookupWord('mitigate');
    expect(vocabMatch).toBeDefined();
    expect(vocabMatch?.word).toBe('mitigate');
    expect(vocabMatch?.band).toBe(8.5);

    const awlMatch = lookupWord('analyze');
    expect(awlMatch).toBeDefined();
    expect(awlMatch?.word).toBe('analyze');

    const nonMatch = lookupWord('zzzznonexistentword');
    expect(nonMatch).toBeNull();

    const shortWord = lookupWord('ab');
    expect(shortWord).toBeNull();
  });

  it('handles selection on DOM and displays tooltip with save action', () => {
    (globalThis as any).browser = {
      runtime: {
        sendMessage: vi.fn(),
      },
    };

    const div = document.createElement('div');
    div.textContent = 'We need to mitigate the risks.';
    document.body.appendChild(div);

    // Mock window selection
    window.getSelection = () => ({
      isCollapsed: false,
      toString: () => 'mitigate',
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, bottom: 120, left: 50, right: 100, width: 50, height: 20 }),
      }),
    } as any);

    handleSelection();

    const tooltip = document.querySelector('.ielts-slayer-tooltip');
    expect(tooltip).not.toBeNull();
    expect(tooltip?.textContent).toContain('mitigate');
    expect(tooltip?.textContent).toContain('+ Add to IELTS Flashcards');

    const saveBtn = tooltip?.querySelector('#ielts-save-btn') as HTMLElement;
    saveBtn.click();
    expect(saveBtn.textContent).toContain('✓ Saved to Flashcards!');
    expect((globalThis as any).browser.runtime.sendMessage).toHaveBeenCalled();

    // Test mousedown outside
    const outsideEvent = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideEvent);
  });

  it('removes tooltip when selection is empty or collapsed', () => {
    window.getSelection = () => ({
      isCollapsed: true,
      toString: () => '',
    } as any);

    handleSelection();
    expect(document.querySelector('.ielts-slayer-tooltip')).toBeNull();
  });

  it('mounts a bilingual local video loop panel and saves a timestamp clip', () => {
    const sendMessage = vi.fn().mockResolvedValue({ success: true });
    (globalThis as any).browser = { runtime: { sendMessage } };

    const video = document.createElement('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: 90 });
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 12 });
    Object.defineProperty(video, 'playbackRate', { configurable: true, writable: true, value: 1 });
    video.play = vi.fn().mockResolvedValue(undefined);
    document.body.appendChild(video);

    const panel = mountVideoStudyPanel(video, 'https://www.youtube.com/watch?v=practice');
    expect(panel).not.toBeNull();
    expect(panel?.textContent).toContain('IELTS Video Lab');

    const loopButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Loop 10s')!;
    loopButton.click();
    expect(panel?.textContent).toContain('Looping 0:12–0:22');
    expect(video.play).toHaveBeenCalled();

    video.currentTime = 23;
    video.dispatchEvent(new Event('timeupdate'));
    expect(video.currentTime).toBe(12);

    const speedSelect = panel!.querySelector('select')!;
    speedSelect.value = '1.25';
    speedSelect.dispatchEvent(new Event('change'));
    expect(video.playbackRate).toBe(1.25);

    const saveButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Save clip')!;
    saveButton.click();
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({
      type: 'SAVE_VIDEO_CLIP',
      data: expect.objectContaining({ startSeconds: 12, endSeconds: 22 }),
    }));

    const languageButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Tiếng Việt')!;
    languageButton.click();
    expect(panel?.textContent).toContain('Phòng học video IELTS');

    const vietnameseLoopButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Lặp 5 giây')!;
    vietnameseLoopButton.click();
    const vietnameseSaveButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Lưu đoạn')!;
    vietnameseSaveButton.click();

    const stopButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Dừng lặp')!;
    stopButton.click();
    expect(panel?.textContent).toContain('Chọn độ dài lặp');
    removeVideoStudyPanel();
  });

  it('keeps controls safe when a loop cannot be created or extension messaging is unavailable', async () => {
    delete (globalThis as any).browser;
    const video = document.createElement('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: 10 });
    Object.defineProperty(video, 'currentTime', { configurable: true, writable: true, value: 10 });
    video.play = vi.fn().mockRejectedValue(new Error('autoplay blocked'));
    document.body.appendChild(video);

    const panel = mountVideoStudyPanel(video, 'https://www.bilibili.com/video/BV1xx');
    const replayButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Replay segment')!;
    replayButton.click();
    const loopButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Loop 10s')!;
    loopButton.click();
    expect(panel?.textContent).toContain('This video is not ready yet');
    const saveButton = Array.from(panel!.querySelectorAll('button')).find(button => button.textContent === 'Save clip')!;
    saveButton.click();
    await Promise.resolve();
    removeVideoStudyPanel();
  });

  it('waits for a single-page video player and cleans up on an unsupported route', async () => {
    initializeVideoStudyPanel('https://www.youtube.com/watch?v=waiting');
    const video = document.createElement('video');
    Object.defineProperty(video, 'duration', { configurable: true, value: 60 });
    document.body.appendChild(video);
    await Promise.resolve();
    expect(document.querySelector('.ielts-slayer-video-lab')).not.toBeNull();

    initializeVideoStudyPanel('https://example.com/video');
    expect(document.querySelector('.ielts-slayer-video-lab')).toBeNull();
  });

  it('does not mount video controls for unsupported pages or without a video element', () => {
    expect(mountVideoStudyPanel(null, 'https://example.com/video')).toBeNull();
    expect(mountVideoStudyPanel(null, 'https://www.youtube.com/watch?v=no-player')).toBeNull();
  });
});
