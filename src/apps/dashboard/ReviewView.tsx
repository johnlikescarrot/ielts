import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { BrainCircuit, CheckCircle2, Eye, Keyboard, Quote } from 'lucide-react';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { createCloze, dueCards, type AppState, type ReviewRating } from '../../core';
import type { MessageKey } from '../../i18n';
import { practiceRepository } from '../../platform/storage';

interface ReviewViewProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState | null>>;
  t: (key: MessageKey) => string;
}

const ratings: readonly { value: ReviewRating; key: 'again' | 'hard' | 'good' | 'easy' }[] = [
  { value: 1, key: 'again' },
  { value: 2, key: 'hard' },
  { value: 3, key: 'good' },
  { value: 4, key: 'easy' },
];

export function ReviewView({ state, setState, t }: ReviewViewProps) {
  const [revealed, setRevealed] = useState(false);
  const cards = dueCards(state.cards, new Date());
  const current = cards[0];

  async function rate(rating: ReviewRating) {
    if (!current) return;
    setState(await practiceRepository.rate(current.id, rating));
    setRevealed(false);
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.code === 'Space') {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      const rating = Number(event.key) as ReviewRating;
      if (revealed && rating >= 1 && rating <= 4) void rate(rating);
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  return (
    <div className="view review-view">
      <header className="view-header">
        <div>
          <p className="eyebrow">
            <BrainCircuit size={14} /> {t('reviewEyebrow')}
          </p>
          <Heading level={1}>{t('reviewTitle')}</Heading>
          <Text as="p" type="large" color="secondary">
            {t('reviewInstruction')}
          </Text>
        </div>
        <Badge variant="warning" label={String(cards.length)} icon={<BrainCircuit size={13} />} />
      </header>

      {current ? (
        <Card className={revealed ? 'review-card is-revealed' : 'review-card'} padding={6}>
          <div className="review-card__meta">
            <Badge variant="info" label={t(current.skill)} />
            <span>
              {cards.length} {t('dueNow').toLocaleLowerCase()}
            </span>
          </div>

          <div className="review-prompt">
            <Quote size={25} />
            <Heading level={2}>{createCloze(current.context, current.prompt)}</Heading>
          </div>

          {!revealed ? (
            <Button
              label={t('showAnswer')}
              variant="primary"
              size="lg"
              onClick={() => setRevealed(true)}
              icon={<Eye size={18} />}
            />
          ) : (
            <div className="answer-panel">
              <p className="answer-word">{current.prompt}</p>
              {current.answer && <p className="answer-note">{current.answer}</p>}
              {current.context && current.context !== current.prompt && (
                <blockquote>{current.context}</blockquote>
              )}
              <div className="rating-grid">
                {ratings.map((rating) => (
                  <button
                    className={`rating-button rating-button--${rating.key}`}
                    key={rating.value}
                    onClick={() => void rate(rating.value)}
                    type="button"
                  >
                    <kbd>{rating.value}</kbd>
                    <span>{t(rating.key)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="keyboard-hint">
            <Keyboard size={14} /> {t('reviewShortcut')}
          </div>
        </Card>
      ) : (
        <Card className="empty-card" padding={6}>
          <EmptyState
            title={t('noDueTitle')}
            description={t('noDueBody')}
            icon={<CheckCircle2 size={42} className="success-icon" />}
          />
        </Card>
      )}
    </div>
  );
}
