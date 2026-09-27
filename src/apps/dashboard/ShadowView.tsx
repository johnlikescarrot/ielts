/* eslint-disable jsx-a11y/media-has-caption -- Self-recorded practice audio has no independent caption source. */
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Headphones, Mic2, Play, Radio, RotateCcw, Square, Waves } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cardsForSkill, type AppState } from '../../core';
import type { MessageKey } from '../../i18n';

interface ShadowViewProps {
  state: AppState;
  t: (key: MessageKey) => string;
}

export function ShadowView({ state, t }: ShadowViewProps) {
  const cards = cardsForSkill(state.cards, 'speaking');
  const [selectedId, setSelectedId] = useState(cards[0]?.id ?? '');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState('');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const selected = cards.find((card) => card.id === selectedId) ?? cards[0];

  useEffect(
    () => () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [audioUrl],
  );

  function playModel() {
    if (!selected) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selected.context || selected.prompt);
    utterance.lang = 'en-GB';
    utterance.rate = 0.88;
    speechSynthesis.speak(utterance);
  }

  async function startRecording() {
    try {
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = microphone;
      chunks.current = [];
      const nextRecorder = new MediaRecorder(microphone);
      nextRecorder.addEventListener('dataavailable', (event) => chunks.current.push(event.data));
      nextRecorder.addEventListener('stop', () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: nextRecorder.mimeType })));
        microphone.getTracks().forEach((track) => track.stop());
        setMessage(t('recordingReady'));
      });
      recorder.current = nextRecorder;
      nextRecorder.start();
      setMessage('');
      setRecording(true);
    } catch {
      setMessage(t('microphoneError'));
    }
  }

  function stopRecording() {
    recorder.current?.stop();
    setRecording(false);
  }

  return (
    <div className="view shadow-view">
      <header className="view-header">
        <div>
          <p className="eyebrow">
            <Waves size={14} /> {t('shadowEyebrow')}
          </p>
          <Heading level={1}>{t('shadowTitle')}</Heading>
          <Text as="p" type="large" color="secondary">
            {t('shadowBody')}
          </Text>
        </div>
        <Badge variant="success" label={t('localOnly')} icon={<Radio size={13} />} />
      </header>

      {selected ? (
        <div className="shadow-layout">
          <Card className="phrase-rail" padding={3}>
            {cards.map((card) => (
              <button
                className={card.id === selected.id ? 'phrase-item is-active' : 'phrase-item'}
                key={card.id}
                onClick={() => setSelectedId(card.id)}
                type="button"
              >
                <span>{card.prompt}</span>
                <small>{card.context}</small>
              </button>
            ))}
          </Card>

          <Card className="shadow-stage" padding={6}>
            <span className="stage-icon">
              <Mic2 size={25} />
            </span>
            <p className="shadow-phrase">{selected.context || selected.prompt}</p>
            <p className="shadow-focus">{selected.prompt}</p>

            <div className="track-card track-card--model">
              <div>
                <Headphones size={18} />
                <span>
                  <strong>{t('modelVoice')}</strong>
                  <small>Firefox · en-GB · 0.88×</small>
                </span>
              </div>
              <div className="wave-bars" aria-hidden="true">
                {[5, 10, 18, 12, 24, 16, 9, 21, 13, 25, 17, 8, 15, 22, 10].map((height, index) => (
                  <i key={`${height}-${index}`} style={{ height }} />
                ))}
              </div>
              <Button
                label={t('playModel')}
                variant="secondary"
                onClick={playModel}
                icon={<Play size={16} />}
              />
            </div>

            <div className={recording ? 'track-card track-card--recording' : 'track-card'}>
              <div>
                <Mic2 size={18} />
                <span>
                  <strong>{t('yourRecording')}</strong>
                  <small>{message || 'Web Audio · temporary'}</small>
                </span>
              </div>
              {audioUrl ? (
                <audio className="recording-player" src={audioUrl} controls />
              ) : (
                <div className="empty-wave">
                  <Waves size={28} />
                </div>
              )}
              {recording ? (
                <Button
                  label={t('stopRecording')}
                  variant="destructive"
                  onClick={stopRecording}
                  icon={<Square size={15} />}
                />
              ) : (
                <Button
                  label={t('startRecording')}
                  variant="primary"
                  onClick={() => void startRecording()}
                  icon={audioUrl ? <RotateCcw size={16} /> : <Mic2 size={16} />}
                />
              )}
            </div>
          </Card>
        </div>
      ) : (
        <Card className="empty-card" padding={6}>
          <EmptyState title={t('shadowEmpty')} icon={<Mic2 size={42} />} isCompact />
        </Card>
      )}
    </div>
  );
}
