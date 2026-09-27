import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { ExternalLink, Languages, Microscope, Settings, ShieldCheck, Target } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';

import type { AppState, Locale } from '../../core';
import type { MessageKey, TranslationParameters } from '../../i18n';
import { practiceRepository } from '../../platform/storage';

interface SettingsViewProps {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState | null>>;
  t: (key: MessageKey, parameters?: TranslationParameters) => string;
}

export function SettingsView({ state, setState, t }: SettingsViewProps) {
  async function setLocale(locale: Locale) {
    setState(await practiceRepository.configure({ locale }));
  }

  async function setGoal(dailyGoal: number) {
    setState(await practiceRepository.configure({ dailyGoal }));
  }

  return (
    <div className="view settings-view">
      <header className="view-header">
        <div>
          <p className="eyebrow">
            <Settings size={14} /> {t('settingsEyebrow')}
          </p>
          <Heading level={1}>{t('settingsTitle')}</Heading>
        </div>
        <Badge variant="success" label={t('localOnly')} icon={<ShieldCheck size={13} />} />
      </header>

      <div className="settings-grid">
        <Card className="settings-card" padding={5}>
          <span className="settings-icon">
            <Languages size={21} />
          </span>
          <div>
            <Heading level={3}>{t('language')}</Heading>
            <Text type="supporting">English is the default</Text>
          </div>
          <div className="choice-row">
            {(['en', 'vi'] as const).map((locale) => (
              <button
                className={
                  state.settings.locale === locale ? 'choice-button is-active' : 'choice-button'
                }
                key={locale}
                onClick={() => void setLocale(locale)}
                type="button"
              >
                {locale === 'en' ? t('english') : t('vietnamese')}
              </button>
            ))}
          </div>
        </Card>

        <Card className="settings-card" padding={5}>
          <span className="settings-icon">
            <Target size={21} />
          </span>
          <div>
            <Heading level={3}>{t('dailyGoal')}</Heading>
            <Text type="supporting">FSRS retrievals per day</Text>
          </div>
          <div className="choice-row">
            {[10, 20, 30, 40].map((goal) => (
              <button
                className={
                  state.settings.dailyGoal === goal ? 'choice-button is-active' : 'choice-button'
                }
                key={goal}
                onClick={() => void setGoal(goal)}
                type="button"
              >
                {t('goalReviews', { count: goal })}
              </button>
            ))}
          </div>
        </Card>

        <Card className="settings-card settings-card--wide" padding={5}>
          <span className="settings-icon settings-icon--green">
            <ShieldCheck size={21} />
          </span>
          <div>
            <Heading level={3}>{t('privacyTitle')}</Heading>
            <Text as="p" type="body" color="secondary">
              {t('privacyBody')}
            </Text>
          </div>
        </Card>

        <Card className="settings-card settings-card--wide" padding={5}>
          <span className="settings-icon settings-icon--blue">
            <Microscope size={21} />
          </span>
          <div>
            <Heading level={3}>{t('researchTitle')}</Heading>
            <Text as="p" type="body" color="secondary">
              {t('researchBody')}
            </Text>
            <a
              className="research-link"
              href="https://github.com/johnlikescarrot/ielts/blob/main/docs/RESEARCH.md"
              target="_blank"
              rel="noreferrer"
            >
              {t('readResearch')} <ExternalLink size={14} />
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
