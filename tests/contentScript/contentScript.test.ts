import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lookupWord, handleSelection, removeTooltip } from '../../src/contentScript/contentScript';

describe('contentScript Suite', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    removeTooltip();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('looks up words across different CEFR levels in AWL', () => {
    const vocabMatch = lookupWord('mitigate');
    expect(vocabMatch).toBeDefined();
    expect(vocabMatch?.word).toBe('mitigate');
    expect(vocabMatch?.band).toBe(8.5);

    // B2 word (analyze) -> band 6.5
    const awlB2 = lookupWord('analyze');
    expect(awlB2).toBeDefined();
    expect(awlB2?.band).toBe(6.5);

    // C1 word (constitute) -> band 7.5
    const awlC1 = lookupWord('constitute');
    expect(awlC1).toBeDefined();
    expect(awlC1?.band).toBe(7.5);

    // C2 word (if any in AWL)
    const nonMatch = lookupWord('zzzznonexistentword');
    expect(nonMatch).toBeNull();

    const shortWord = lookupWord('ab');
    expect(shortWord).toBeNull();

    const emptyWord = lookupWord('   ');
    expect(emptyWord).toBeNull();
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

    // Advance timer to trigger timeout removal
    vi.advanceTimersByTime(1500);
    expect(document.querySelector('.ielts-slayer-tooltip')).toBeNull();

    delete (globalThis as any).browser;
  });

  it('removes tooltip on outside mousedown', () => {
    const div = document.createElement('div');
    div.textContent = 'mitigate';
    document.body.appendChild(div);

    window.getSelection = () => ({
      isCollapsed: false,
      toString: () => 'mitigate',
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ top: 100, bottom: 120, left: 50, right: 100, width: 50, height: 20 }),
      }),
    } as any);

    handleSelection();
    expect(document.querySelector('.ielts-slayer-tooltip')).not.toBeNull();

    // Dispatch mousedown on body
    const outsideEvent = new MouseEvent('mousedown', { bubbles: true });
    document.body.dispatchEvent(outsideEvent);
    expect(document.querySelector('.ielts-slayer-tooltip')).toBeNull();
  });

  it('triggers mouseup document listener', () => {
    const mouseupEvent = new MouseEvent('mouseup', { bubbles: true });
    document.dispatchEvent(mouseupEvent);
  });

  it('removes tooltip when selection is empty or collapsed', () => {
    window.getSelection = () => ({
      isCollapsed: true,
      toString: () => '',
    } as any);

    handleSelection();
    expect(document.querySelector('.ielts-slayer-tooltip')).toBeNull();
  });

  it('removes explicit ielts-slayer-tooltip-root from DOM', () => {
    const div = document.createElement('div');
    div.id = 'ielts-slayer-tooltip-root';
    document.body.appendChild(div);

    expect(document.getElementById('ielts-slayer-tooltip-root')).not.toBeNull();

    removeTooltip();

    expect(document.getElementById('ielts-slayer-tooltip-root')).toBeNull();
  });

  it('removes tooltip and returns early when word is not found in dictionary', () => {
    window.getSelection = () => ({
      isCollapsed: false,
      toString: () => 'nonexistentword',
    } as any);

    handleSelection();
    expect(document.querySelector('.ielts-slayer-tooltip')).toBeNull();
  });
});
