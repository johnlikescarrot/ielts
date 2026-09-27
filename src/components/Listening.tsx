import {useRef, useState} from 'react';
import {Badge, Button, Card, Heading, Text} from '@astryxdesign/core';
import type {StudyState, SubtitleCue} from '../types';
import {compareTempo, parseSubtitles} from '../lib/metrics';
import {recordSession} from '../lib/model';
import {useRecorder} from '../hooks/useRecorder';
import type {CopyKey} from '../lib/i18n';

interface Props {
  state: StudyState;
  commit: (update: (state: StudyState) => StudyState) => void;
  t: (key: CopyKey) => string;
}

export function Listening({commit, t}: Props) {
  const [audioUrl, setAudioUrl] = useState('');
  const [cues, setCues] = useState<SubtitleCue[]>([]);
  const [index, setIndex] = useState(0);
  const [loop, setLoop] = useState(true);
  const audio = useRef<HTMLAudioElement>(null);
  const recording = useRecorder();
  const cue = cues[index];
  const referenceDuration = cue
    ? cue.end - cue.start
    : (audio.current?.duration ?? 0);
  const tempo = compareTempo(referenceDuration, recording.duration);
  const tempoKey =
    tempo === 'close'
      ? 'closeTempo'
      : tempo === 'shorter'
        ? 'shorter'
        : tempo === 'longer'
          ? 'longer'
          : 'unknownTempo';

  const loadAudio = (file?: File) => {
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(URL.createObjectURL(file));
  };
  const loadTranscript = async (file?: File) => {
    if (!file) return;
    setCues(parseSubtitles(await file.text()));
    setIndex(0);
  };
  const seek = (nextIndex: number) => {
    const bounded = Math.max(0, Math.min(cues.length - 1, nextIndex));
    setIndex(bounded);
    if (audio.current && cues[bounded])
      audio.current.currentTime = cues[bounded].start;
  };
  const timeUpdate = () => {
    if (!loop || !audio.current || !cue || audio.current.currentTime < cue.end)
      return;
    audio.current.currentTime = cue.start;
    void audio.current.play();
  };
  const stopRecording = () => {
    recording.stop();
    commit((current) =>
      recordSession(
        current,
        'listening',
        2,
        cue?.text ?? 'shadowing',
        new Date(),
      ),
    );
  };

  return (
    <div className="view-stack">
      <div className="section-heading">
        <div>
          <Heading level={1}>{t('listeningLab')}</Heading>
          <Text as="p" color="secondary">
            {t('localOnly')}
          </Text>
        </div>
        <Badge variant="cyan" label="A–B" />
      </div>
      <div className="file-grid">
        <label className="file-drop">
          <span aria-hidden="true">♫</span>
          <strong>{t('chooseAudio')}</strong>
          <input
            type="file"
            accept="audio/*"
            onChange={(event) => loadAudio(event.target.files?.[0])}
          />
        </label>
        <label className="file-drop">
          <span aria-hidden="true">CC</span>
          <strong>{t('chooseTranscript')}</strong>
          <input
            type="file"
            accept=".srt,.vtt,text/vtt"
            onChange={(event) => void loadTranscript(event.target.files?.[0])}
          />
        </label>
      </div>
      {audioUrl ? (
        <audio
          ref={audio}
          className="audio-player"
          src={audioUrl}
          controls
          onTimeUpdate={timeUpdate}
        />
      ) : null}
      <Card padding={6} elevation="low">
        <div className="shadow-card">
          {cue ? (
            <>
              <Text as="span" type="supporting" color="secondary">
                {index + 1} / {cues.length} · {cue.start.toFixed(1)}–
                {cue.end.toFixed(1)}s
              </Text>
              <Heading level={2} type="display-3">
                {cue.text}
              </Heading>
            </>
          ) : (
            <Heading level={2}>{t('transcriptHint')}</Heading>
          )}
          <label className="check-row">
            <input
              type="checkbox"
              checked={loop}
              onChange={(event) => setLoop(event.target.checked)}
            />
            A–B loop
          </label>
        </div>
      </Card>
      <div className="action-row">
        <Button
          label={t('previous')}
          onClick={() => seek(index - 1)}
          isDisabled={!cue || index === 0}
        />
        <Button
          label={t('next')}
          onClick={() => seek(index + 1)}
          isDisabled={!cue || index === cues.length - 1}
        />
        <Button
          label={recording.recording ? t('stop') : t('record')}
          variant="primary"
          clickAction={recording.recording ? stopRecording : recording.start}
        />
      </div>
      {recording.audioUrl ? (
        <Card padding={4} variant="green">
          <audio className="audio-player" src={recording.audioUrl} controls />
          <Text as="p">{t(tempoKey)}</Text>
        </Card>
      ) : null}
    </div>
  );
}
