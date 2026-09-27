import {useState} from 'react';
import {Badge, Button, Heading, Text} from '@astryxdesign/core';
import type {StudyState} from '../types';
import {addCapture} from '../lib/model';
import {captureActiveSelection, openDashboard} from '../lib/browser';
import {dueCards} from '../lib/metrics';
import type {CopyKey} from '../lib/i18n';

interface Props {
  state: StudyState;
  commit: (update: (state: StudyState) => StudyState) => void;
  t: (key: CopyKey) => string;
}

export function QuickPanel({state, commit, t}: Props) {
  const [notice, setNotice] = useState('');
  const capture = async () => {
    try {
      const selection = await captureActiveSelection();
      if (!selection.text.trim()) {
        setNotice(t('nothingSelected'));
        return;
      }
      commit((current) =>
        addCapture(
          current,
          {
            text: selection.text,
            sourceTitle: selection.title,
            sourceUrl: selection.url,
          },
          new Date(),
        ),
      );
      setNotice(t('selectionSaved'));
    } catch {
      setNotice(t('nothingSelected'));
    }
  };
  return (
    <main className="quick-panel">
      <header>
        <div className="brand">
          <span className="brand-glyph">B</span>
          <strong>{t('appName')}</strong>
        </div>
        <Badge
          variant="orange"
          label={`${dueCards(state.cards, new Date()).length} ${t('dueNow').toLocaleLowerCase()}`}
        />
      </header>
      <section>
        <Heading level={1}>{t('quickCapture')}</Heading>
        <Text as="p" color="secondary">
          {t('tagline')}
        </Text>
      </section>
      <div className="quick-actions">
        <Button
          label={t('saveSelection')}
          variant="primary"
          width="100%"
          clickAction={capture}
        />
        <Button
          label={t('openStudio')}
          width="100%"
          clickAction={openDashboard}
        />
      </div>
      {notice ? (
        <p className="notice" role="status">
          {notice}
        </p>
      ) : null}
      <footer>{t('privacy')}</footer>
    </main>
  );
}
