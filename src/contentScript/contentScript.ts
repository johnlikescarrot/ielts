import { ACADEMIC_WORD_LIST } from '../ast/awlList';
import { INITIAL_VOCABULARY } from '../data/vocabularyBank';

let activeTooltip: HTMLElement | null = null;

const VOCAB_DICT: Record<string, typeof INITIAL_VOCABULARY[0]> = Object.create(null);
for (const v of INITIAL_VOCABULARY) {
  VOCAB_DICT[v.word.toLowerCase()] = v;
}

export function removeTooltip(): void {
  if (activeTooltip && activeTooltip.parentNode) {
    activeTooltip.parentNode.removeChild(activeTooltip);
    activeTooltip = null;
  }

  const existing = document.getElementById('ielts-slayer-tooltip-root');
  if (existing) {
    existing.remove();
  }
}

export function lookupWord(rawWord: string) {
  const normalized = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized || normalized.length < 3) return null;

  // Check initial vocab bank first
  const bankMatch = VOCAB_DICT[normalized];
  if (bankMatch) {
    return {
      word: bankMatch.word,
      phonetic: bankMatch.phonetic,
      cefr: bankMatch.cefrLevel,
      band: bankMatch.bandScore,
      defEn: bankMatch.definitionEn,
      defVi: bankMatch.definitionVi,
    };
  }

  // Check AWL list
  const awlMatch = ACADEMIC_WORD_LIST[normalized];
  if (awlMatch) {
    return {
      word: normalized,
      phonetic: '/.../',
      cefr: awlMatch.cefr,
      band: awlMatch.cefr === 'C2' ? 8.5 : awlMatch.cefr === 'C1' ? 7.5 : 6.5,
      defEn: awlMatch.definition,
      defVi: awlMatch.definitionVi,
    };
  }

  return null;
}

export function handleSelection(): void {
  if (typeof window === 'undefined') return;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    removeTooltip();
    return;
  }

  const selectedText = selection.toString().trim();
  const info = lookupWord(selectedText);
  if (!info) {
    removeTooltip();
    return;
  }

  removeTooltip();

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  const tooltip = document.createElement('div');
  tooltip.className = 'ielts-slayer-tooltip';
  tooltip.style.left = `${window.scrollX + rect.left}px`;
  tooltip.style.top = `${window.scrollY + rect.bottom + 8}px`;

  const header = document.createElement('div');
  header.className = 'ielts-slayer-tooltip-header';

  const title = document.createElement('span');
  title.className = 'ielts-slayer-tooltip-title';
  title.textContent = info.word;

  const badge = document.createElement('span');
  badge.className = 'ielts-slayer-tooltip-badge';
  badge.textContent = `Band ${info.band.toFixed(1)} (${info.cefr})`;

  header.appendChild(title);
  header.appendChild(badge);

  const defEn = document.createElement('div');
  defEn.className = 'ielts-slayer-tooltip-def';
  defEn.textContent = info.defEn;

  const defVi = document.createElement('div');
  defVi.className = 'ielts-slayer-tooltip-def-vi';
  defVi.textContent = info.defVi;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'ielts-slayer-tooltip-btn';
  saveBtn.id = 'ielts-save-btn';
  saveBtn.textContent = '+ Add to IELTS Flashcards';

  tooltip.appendChild(header);
  tooltip.appendChild(defEn);
  tooltip.appendChild(defVi);
  tooltip.appendChild(saveBtn);

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      saveBtn.textContent = '✓ Saved to Flashcards!';
      if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.sendMessage({
          type: 'SAVE_VOCABULARY',
          data: {
            id: `cs_${Date.now()}`,
            word: info.word,
            phonetic: info.phonetic,
            definitionEn: info.defEn,
            definitionVi: info.defVi,
            partOfSpeech: 'word',
            example: `Found in context: "${selectedText}"`,
            collocations: [],
            synonyms: [],
            topic: 'Web Inspector',
            bandScore: info.band,
            cefrLevel: info.cefr,
            isAWL: true,
          }
        });
      }
      setTimeout(removeTooltip, 1200);
    });
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('mouseup', handleSelection);
  document.addEventListener('mousedown', (e) => {
    if (activeTooltip && !activeTooltip.contains(e.target as Node)) {
      removeTooltip();
    }
  });
}
