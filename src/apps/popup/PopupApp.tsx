import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { ArrowUpRight, BrainCircuit, Flame, ShieldCheck } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { dueCards, type AppState, type CaptureInput } from '../../core';
import { translator } from '../../i18n';
import { getActivePageContext, openDashboard } from '../../platform/browser';
import { practiceRepository } from '../../platform/storage';
import { CaptureForm } from '../shared/CaptureForm';

export function PopupApp() {
  const [state, setState] = useState<AppState | null>(null);
  const [initial, setInitial] = useState<CaptureInput>({ prompt: '', context: '' });

  useEffect(() => {
    void Promise.all([practiceRepository.load(), getActivePageContext()]).then(([loaded, page]) => {
      setState(loaded);
      setInitial({
        prompt: page.selection,
        context: page.selection,
        skill: 'reading',
        source: { title: page.title, url: page.url },
      });
    });
  }, []);

  const t = useMemo(() => translator(state?.settings.locale ?? 'en'), [state?.settings.locale]);

  if (state === null) {
    return (
      <main className="popup-shell popup-shell--loading" role="status">
        IELTS Forge
      </main>
    );
  }

  async function capture(input: CaptureInput): Promise<boolean> {
    const result = await practiceRepository.capture(input);
    setState(result.state);
    return result.added;
  }

  const due = dueCards(state.cards, new Date()).length;

  return (
    <main className="popup-shell">
      <header className="popup-header">
        <div className="brand-mark">
          <Flame size={20} fill="currentColor" />
        </div>
        <div className="popup-brand">
          <strong>{t('appName')}</strong>
          <span>{t('appTagline')}</span>
        </div>
        <Badge variant="success" label={t('localOnly')} />
      </header>

      <Card className="popup-card" padding={4}>
        <div className="popup-title-row">
          <div>
            <p className="eyebrow">Selection → FSRS</p>
            <Heading level={2}>{t('popupCapture')}</Heading>
          </div>
          <span className="metric-orb">
            <BrainCircuit size={19} />
          </span>
        </div>
        <Text as="p" type="supporting">
          {t('popupSelectionHint')}
        </Text>
        <CaptureForm initial={initial} compact onCapture={capture} t={t} />
      </Card>

      <Button
        label={t('openStudio')}
        variant="primary"
        width="100%"
        onClick={() => void openDashboard()}
        endContent={
          <>
            <span className="due-pill">{t('dueCount', { count: due })}</span>
            <ArrowUpRight size={16} />
          </>
        }
      />

      <footer className="popup-footer">
        <ShieldCheck size={13} /> {t('noAccount')}
      </footer>
    </main>
  );
}
