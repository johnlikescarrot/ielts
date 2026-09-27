import {useEffect, useMemo, useState} from 'react';
import {Badge, Button, Card, Heading, Text} from '@astryxdesign/core';
import type {ReviewRating, StudyState} from '../types';
import {addCard, reviewCard, updateCardMeaning} from '../lib/model';
import {dueCards} from '../lib/metrics';
import type {CopyKey} from '../lib/i18n';

interface Props {
  state: StudyState;
  commit: (update: (state: StudyState) => StudyState) => void;
  t: (key: CopyKey) => string;
}

export function Vocabulary({state, commit, t}: Props) {
  const queue = useMemo(() => dueCards(state.cards, new Date()), [state.cards]);
  const card = queue[0];
  const [revealed, setRevealed] = useState(false);
  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    setRevealed(false);
    setAnswer(card?.meaning ?? '');
  }, [card?.id, card?.meaning]);

  const rate = (rating: ReviewRating) => {
    if (!card || !revealed) return;
    if (answer !== card.meaning)
      commit((current) => updateCardMeaning(current, card.id, answer));
    commit((current) => reviewCard(current, card.id, rating, new Date()));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;
      if (event.code === 'Space') {
        event.preventDefault();
        setRevealed(true);
      }
      const ratings: Record<string, ReviewRating> = {
        Digit1: 'again',
        Digit2: 'hard',
        Digit3: 'good',
        Digit4: 'easy',
      };
      const rating = ratings[event.code];
      if (rating) rate(rating);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    commit((current) => addCard(current, {term, meaning}, new Date()));
    setTerm('');
    setMeaning('');
  };

  return (
    <div className="view-stack">
      <div className="section-heading">
        <div>
          <Heading level={1}>{t('vocabulary')}</Heading>
          <Text as="p" color="secondary">
            FSRS · Space · 1 2 3 4
          </Text>
        </div>
        <Badge
          variant="orange"
          label={`${queue.length} ${t('dueNow').toLocaleLowerCase()}`}
        />
      </div>

      <Card padding={6} elevation="low">
        {card ? (
          <div className="review-card">
            <Text as="span" type="supporting" color="secondary">
              {card.sourceTitle || t('context')}
            </Text>
            <Heading level={2} type="display-3">
              {card.term}
            </Heading>
            {card.context && card.context !== card.term ? (
              <blockquote>{card.context}</blockquote>
            ) : null}
            {!revealed ? (
              <Button
                label={t('reveal')}
                variant="primary"
                onClick={() => setRevealed(true)}
              />
            ) : (
              <div className="answer-panel">
                <label className="field">
                  <span>{t('meaning')}</span>
                  <input
                    value={answer}
                    onChange={(event) => setAnswer(event.target.value)}
                    autoFocus
                  />
                </label>
                <div className="rating-grid">
                  {(['again', 'hard', 'good', 'easy'] as ReviewRating[]).map(
                    (rating, index) => (
                      <Button
                        key={rating}
                        label={`${index + 1} · ${t(rating)}`}
                        variant={rating === 'good' ? 'primary' : 'secondary'}
                        onClick={() => rate(rating)}
                      />
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <span aria-hidden="true">✓</span>
            <Heading level={2}>{t('noDue')}</Heading>
          </div>
        )}
      </Card>

      <section className="section-block">
        <Heading level={2}>{t('addCard')}</Heading>
        <form className="inline-form" onSubmit={submit}>
          <label className="field">
            <span>{t('term')}</span>
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>{t('meaning')}</span>
            <input
              value={meaning}
              onChange={(event) => setMeaning(event.target.value)}
            />
          </label>
          <Button label={t('save')} variant="primary" type="submit" />
        </form>
      </section>
    </div>
  );
}
