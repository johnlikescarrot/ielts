import {useRef, useState} from 'react';
import {Badge, Button, Card, Heading, Text} from '@astryxdesign/core';
import type {Locale, StudyState, ThemeMode} from '../types';
import {createInitialState, updateSettings} from '../lib/model';
import {downloadBackup} from '../lib/browser';
import {parseBackup, stringifyBackup} from '../lib/storage';
import type {CopyKey} from '../lib/i18n';

interface Props {
  state: StudyState;
  commit: (update: (state: StudyState) => StudyState) => void;
  t: (key: CopyKey) => string;
}

export function Settings({state, commit, t}: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const patch = (values: Parameters<typeof updateSettings>[1]) =>
    commit((current) => updateSettings(current, values));
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const imported = parseBackup(await file.text());
      commit(() => imported);
      setNotice(t('imported'));
    } catch {
      setNotice(t('importError'));
    }
  };
  const reset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    commit(() => createInitialState());
    setConfirmReset(false);
  };

  return (
    <div className="view-stack">
      <div className="section-heading">
        <div>
          <Heading level={1}>{t('settings')}</Heading>
          <Text as="p" color="secondary">
            {t('privacy')}
          </Text>
        </div>
        <Badge variant="success" label="100% local" />
      </div>
      <Card padding={5}>
        <div className="settings-grid">
          <label className="field">
            <span>{t('language')}</span>
            <select
              value={state.settings.locale}
              onChange={(event) =>
                patch({locale: event.target.value as Locale})
              }
            >
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          </label>
          <label className="field">
            <span>{t('targetBand')}</span>
            <input
              type="number"
              min="4"
              max="9"
              step="0.5"
              value={state.settings.targetBand}
              onChange={(event) =>
                patch({targetBand: Number(event.target.value)})
              }
            />
          </label>
          <label className="field">
            <span>
              {t('dailyGoal')} ({t('minutes').toLocaleLowerCase()})
            </span>
            <input
              type="number"
              min="5"
              max="180"
              value={state.settings.dailyGoal}
              onChange={(event) =>
                patch({dailyGoal: Number(event.target.value)})
              }
            />
          </label>
          <label className="field">
            <span>{t('theme')}</span>
            <select
              value={state.settings.theme}
              onChange={(event) =>
                patch({theme: event.target.value as ThemeMode})
              }
            >
              <option value="system">{t('system')}</option>
              <option value="light">{t('light')}</option>
              <option value="dark">{t('dark')}</option>
            </select>
          </label>
        </div>
      </Card>
      <section className="section-block">
        <Heading level={2}>Data</Heading>
        <div className="action-row">
          <Button
            label={t('export')}
            variant="primary"
            onClick={() =>
              downloadBackup(
                stringifyBackup(state),
                `bandcraft-${new Date().toISOString().slice(0, 10)}.json`,
              )
            }
          />
          <Button
            label={t('import')}
            onClick={() => fileInput.current?.click()}
          />
          <Button
            label={confirmReset ? t('resetConfirm') : t('reset')}
            variant="destructive"
            onClick={reset}
          />
          <input
            ref={fileInput}
            className="visually-hidden"
            type="file"
            accept="application/json"
            onChange={(event) => void importFile(event.target.files?.[0])}
          />
        </div>
        {notice ? <p role="status">{notice}</p> : null}
      </section>
      <Card padding={4} variant="muted">
        <Text as="p">
          Bandcraft is not affiliated with, approved by, or endorsed by IELTS,
          Cambridge University Press & Assessment, the British Council, or IDP
          Education. IELTS is a registered trademark of its owners.
        </Text>
      </Card>
    </div>
  );
}
