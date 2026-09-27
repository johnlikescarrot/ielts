import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { Download, ExternalLink, FileUp, Library, Search, Trash2 } from 'lucide-react';
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from 'react';

import { exportState, importState, type AppState, type Skill } from '../../core';
import type { MessageKey } from '../../i18n';
import { downloadText } from '../../platform/browser';
import { practiceRepository } from '../../platform/storage';

interface LibraryViewProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState | null>>;
  t: (key: MessageKey) => string;
}

export function LibraryView({ state, setState, t }: LibraryViewProps) {
  const [query, setQuery] = useState('');
  const [skill, setSkill] = useState<Skill | 'all'>('all');
  const [status, setStatus] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const cards = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return state.cards.filter((card) => {
      const matchesSkill = skill === 'all' || card.skill === skill;
      const haystack = `${card.prompt} ${card.answer} ${card.context}`.toLocaleLowerCase();
      return matchesSkill && haystack.includes(needle);
    });
  }, [query, skill, state.cards]);

  async function remove(cardId: string) {
    setState(await practiceRepository.remove(cardId));
  }

  function exportBackup() {
    const today = new Date().toISOString().slice(0, 10);
    downloadText(`ielts-forge-${today}.json`, exportState(state, new Date()));
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const next = importState(await file.text());
      setState(await practiceRepository.replace(next));
      setStatus(t('importSuccess'));
    } catch {
      setStatus(t('importError'));
    }
    event.target.value = '';
  }

  return (
    <div className="view library-view">
      <header className="view-header">
        <div>
          <p className="eyebrow">
            <Library size={14} /> {t('libraryEyebrow')}
          </p>
          <Heading level={1}>{t('libraryTitle')}</Heading>
          <Text as="p" type="large" color="secondary">
            {state.cards.length} {t('cardsLearned').toLocaleLowerCase()}
          </Text>
        </div>
        <div className="button-row">
          <Button
            label={t('exportBackup')}
            variant="secondary"
            onClick={exportBackup}
            icon={<Download size={16} />}
          />
          <Button
            label={t('importBackup')}
            variant="secondary"
            onClick={() => fileInput.current?.click()}
            icon={<FileUp size={16} />}
          />
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => void importBackup(event)}
          />
        </div>
      </header>

      {status && (
        <p className="inline-notice" role="status">
          {status}
        </p>
      )}

      <div className="library-tools">
        <TextInput
          label={t('searchLabel')}
          isLabelHidden
          value={query}
          onChange={setQuery}
          placeholder={t('searchPlaceholder')}
          startIcon={<Search size={16} />}
          hasClear
          width="100%"
        />
        <select
          className="forge-select"
          value={skill}
          onChange={(event) => setSkill(event.target.value as Skill | 'all')}
          aria-label={t('skillLabel')}
        >
          <option value="all">{t('allSkills')}</option>
          <option value="reading">{t('reading')}</option>
          <option value="listening">{t('listening')}</option>
          <option value="writing">{t('writing')}</option>
          <option value="speaking">{t('speaking')}</option>
        </select>
      </div>

      {cards.length === 0 ? (
        <Card className="empty-card" padding={6}>
          <EmptyState
            title={t('noCardsTitle')}
            description={t('noCardsBody')}
            icon={<Library size={42} />}
          />
        </Card>
      ) : (
        <div className="library-grid">
          {cards.map((card) => (
            <Card className="library-card" key={card.id} padding={4}>
              <div className="library-card__top">
                <Badge variant="info" label={t(card.skill)} />
                <span>{new Date(card.createdAt).toLocaleDateString(state.settings.locale)}</span>
              </div>
              <Heading level={3}>{card.prompt}</Heading>
              {card.answer && <p className="library-answer">{card.answer}</p>}
              {card.context && <blockquote>{card.context}</blockquote>}
              <div className="library-card__actions">
                {card.source?.url && (
                  <a href={card.source.url} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} /> {t('openSource')}
                  </a>
                )}
                <button type="button" onClick={() => void remove(card.id)}>
                  <Trash2 size={14} /> {t('remove')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
