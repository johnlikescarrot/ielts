import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lookupWord, handleSelection, removeTooltip, escapeHtml } from '../../src/contentScript/contentScript';

describe('contentScript Suite', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    removeTooltip();
  });

  it('escapes content-script tooltip values before HTML interpolation', () => {
    expect(escapeHtml(`<script>alert("x")</script>`)).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(escapeHtml("it's safe & sound")).toBe('it&#39;s safe &amp; sound');
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
});
