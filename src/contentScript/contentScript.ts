import { ACADEMIC_WORD_LIST } from '../ast/awlList';
import { INITIAL_VOCABULARY } from '../data/vocabularyBank';

let activeTooltip: HTMLElement | null = null;

export function removeTooltip(): void {
  if (activeTooltip && activeTooltip.parentNode) {
    activeTooltip.parentNode.removeChild(activeTooltip);
    activeTooltip = null;
  }
}

export function lookupWord(rawWord: string) {
  const normalized = rawWord.trim().toLowerCase().replace(/[^a-z]/g, '');
  if (!normalized || normalized.length < 3) return null;

  // Check initial vocab bank first
  const bankMatch = INITIAL_VOCABULARY.find(v => v.word.toLowerCase() === normalized);
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

  tooltip.innerHTML = `
    <div class="ielts-slayer-tooltip-header">
      <span class="ielts-slayer-tooltip-title">${info.word}</span>
      <span class="ielts-slayer-tooltip-badge">Band ${info.band.toFixed(1)} (${info.cefr})</span>
    </div>
    <div class="ielts-slayer-tooltip-def">${info.defEn}</div>
    <div class="ielts-slayer-tooltip-def-vi">${info.defVi}</div>
    <button class="ielts-slayer-tooltip-btn" id="ielts-save-btn">+ Add to IELTS Flashcards</button>
  `;

  document.body.appendChild(tooltip);
  activeTooltip = tooltip;

  const saveBtn = tooltip.querySelector('#ielts-save-btn');
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
