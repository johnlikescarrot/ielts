import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Headphones, Mic, Play, RotateCcw, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Kbd } from '@astryxdesign/core/Kbd';
import { Section } from '@astryxdesign/core/Section';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { VoiceRecorder } from '../common/VoiceRecorder';
import { useI18n } from '../../i18n/i18nContext';
import type { CuePlaybackWindow } from '../../video/localMedia';
import { formatTimestamp, getYouTubeVideoId, TranscriptCue } from '../../video/videoLesson';
import {
  clampChunkIndex,
  createShadowingChunks,
  DEFAULT_CHUNK_SECONDS,
  nextShadowingRate,
  SHADOWING_RATES,
} from '../../video/shadowing';

export interface ShadowingLabProps {
  cues: TranscriptCue[];
  sourceUrl: string;
  onContinue: () => void;
  onPlayOriginal?: (window: CuePlaybackWindow) => void;
}

const CHUNK_OPTIONS = [3, 5, DEFAULT_CHUNK_SECONDS, 12] as const;
const REPETITION_OPTIONS = [1, 2, 3] as const;

export const ShadowingLab: React.FC<ShadowingLabProps> = ({ cues, sourceUrl, onContinue, onPlayOriginal }) => {
  const { t } = useI18n();
  const [chunkSeconds, setChunkSeconds] = useState(DEFAULT_CHUNK_SECONDS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [rate, setRate] = useState<number>(1);
  const [repetitions, setRepetitions] = useState<number>(2);
  const [isListening, setIsListening] = useState(false);
  const [recordingCount, setRecordingCount] = useState(0);
  const speechRunRef = useRef(0);

  const chunks = useMemo(() => createShadowingChunks(cues, chunkSeconds), [cues, chunkSeconds]);
  const activeChunk = chunks[clampChunkIndex(activeIndex, chunks.length)];
  const videoId = useMemo(() => getYouTubeVideoId(sourceUrl), [sourceUrl]);

  const stopListening = useCallback(() => {
    speechRunRef.current += 1;
    window.speechSynthesis?.cancel();
    setIsListening(false);
  }, []);

  const playActiveChunk = useCallback(() => {
    const speech = window.speechSynthesis;
    if (!speech) return;

    speechRunRef.current += 1;
    const runId = speechRunRef.current;
    let completedRepetitions = 0;
    speech.cancel();
    setIsListening(true);

    const playOnce = () => {
      const utterance = new SpeechSynthesisUtterance(activeChunk.text);
      utterance.lang = 'en-GB';
      utterance.rate = rate;
      utterance.onend = () => {
        if (runId !== speechRunRef.current) return;
        completedRepetitions += 1;
        if (completedRepetitions < repetitions) {
          playOnce();
        } else {
          setIsListening(false);
        }
      };
      utterance.onerror = () => {
        if (runId === speechRunRef.current) setIsListening(false);
      };
      speech.speak(utterance);
    };

    playOnce();
  }, [activeChunk, rate, repetitions]);

  const moveToChunk = useCallback((nextIndex: number) => {
    stopListening();
    setActiveIndex(clampChunkIndex(nextIndex, chunks.length));
  }, [chunks.length, stopListening]);

  const openAtTimestamp = () => {
    window.open(
      `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(activeChunk.startSeconds)}s`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  useEffect(() => () => stopListening(), [stopListening]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const tagName = target instanceof HTMLElement ? target.tagName.toLowerCase() : '';
      if (event.metaKey || event.ctrlKey || event.altKey || ['input', 'textarea', 'select', 'button'].includes(tagName)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        if (isListening) stopListening(); else playActiveChunk();
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault();
        moveToChunk(activeIndex + 1);
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        moveToChunk(activeIndex - 1);
      }
      if (event.code === 'KeyR') {
        event.preventDefault();
        setRate(currentRate => nextShadowingRate(currentRate));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, isListening, moveToChunk, playActiveChunk, stopListening]);

  useEffect(() => {
    setActiveIndex(currentIndex => clampChunkIndex(currentIndex, chunks.length));
  }, [chunks.length]);

  if (!activeChunk) return null;

  return (
    <VStack gap={6}>
      <Section variant="muted" padding={5}>
        <VStack gap={3}>
          <HStack gap={2} vAlign="center" wrap="wrap">
            <StatusDot variant="success" label={t('video.shadowingReady')} isPulsing />
            <Text type="label" color="accent">{t('video.shadowingBadge')}</Text>
          </HStack>
          <Heading level={2}>{t('video.shadowingTitle')}</Heading>
          <Text color="secondary">{t('video.shadowingHelp')}</Text>
        </VStack>
      </Section>

      <Grid columns={{ minWidth: 280, max: 2 }} gap={4}>
        <Section padding={4}>
          <VStack gap={3}>
            <Heading level={3}>{t('video.chunkLength')}</Heading>
            <Text type="supporting">{t('video.chunkLengthHelp')}</Text>
            <HStack gap={2} wrap="wrap">
              {CHUNK_OPTIONS.map(seconds => (
                <Button
                  key={seconds}
                  label={t('video.seconds', { count: seconds })}
                  variant={chunkSeconds === seconds ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={chunkSeconds === seconds}
                  onClick={() => {
                    stopListening();
                    setChunkSeconds(seconds);
                    setActiveIndex(0);
                  }}
                />
              ))}
            </HStack>
          </VStack>
        </Section>

        <Section padding={4}>
          <VStack gap={3}>
            <Heading level={3}>{t('video.modelPace')}</Heading>
            <Text type="supporting">{t('video.modelPaceHelp')}</Text>
            <HStack gap={2} wrap="wrap">
              {SHADOWING_RATES.map(nextRate => (
                <Button
                  key={nextRate}
                  label={`${nextRate}×`}
                  variant={rate === nextRate ? 'primary' : 'secondary'}
                  size="sm"
                  aria-pressed={rate === nextRate}
                  onClick={() => setRate(nextRate)}
                />
              ))}
            </HStack>
          </VStack>
        </Section>
      </Grid>

      <Section padding={5} aria-labelledby="shadowing-turn-heading">
        <VStack gap={5}>
          <HStack gap={3} wrap="wrap" vAlign="center">
            <Text type="label" color="accent">{t('video.currentTurn', { current: activeIndex + 1, total: chunks.length })}</Text>
            <Text type="code" color="secondary">
              {formatTimestamp(activeChunk.startSeconds)}–{formatTimestamp(activeChunk.endSeconds)}
            </Text>
          </HStack>
          <Heading id="shadowing-turn-heading" level={3}>{activeChunk.text}</Heading>
          <Text color="secondary">{t('video.shadowingTurnPrompt')}</Text>

          <Grid columns={{ minWidth: 280, max: 2 }} gap={4}>
            <Section variant="muted" padding={4}>
              <VStack gap={3}>
                <HStack gap={2} wrap="wrap" vAlign="center">
                  <Headphones aria-hidden="true" size={20} />
                  <Heading level={4}>{t('video.listenAndLoop')}</Heading>
                </HStack>
                <Text type="supporting">{t('video.listenAndLoopHelp')}</Text>
                <HStack gap={2} wrap="wrap">
                  {REPETITION_OPTIONS.map(count => (
                    <Button
                      key={count}
                      label={t('video.repeatCount', { count })}
                      variant={repetitions === count ? 'primary' : 'secondary'}
                      size="sm"
                      aria-pressed={repetitions === count}
                      onClick={() => setRepetitions(count)}
                    />
                  ))}
                </HStack>
                <HStack gap={2} wrap="wrap">
                  <Button
                    label={isListening ? t('video.stopModel') : t('video.playModel')}
                    variant={isListening ? 'destructive' : 'primary'}
                    icon={isListening ? <RotateCcw size={16} /> : <Volume2 size={16} />}
                    onClick={isListening ? stopListening : playActiveChunk}
                  />
                  {onPlayOriginal && (
                    <Button
                      label={t('video.playOriginal')}
                      variant="secondary"
                      icon={<Play size={16} />}
                      onClick={() => onPlayOriginal({
                        startSeconds: activeChunk.startSeconds,
                        endSeconds: activeChunk.endSeconds,
                      })}
                    />
                  )}
                  {videoId && (
                    <Button
                      label={t('video.openVideo')}
                      variant="ghost"
                      icon={<ExternalLink size={16} />}
                      onClick={openAtTimestamp}
                    />
                  )}
                </HStack>
              </VStack>
            </Section>

            <Section variant="muted" padding={4}>
              <VStack gap={3}>
                <HStack gap={2} wrap="wrap" vAlign="center">
                  <Mic aria-hidden="true" size={20} />
                  <Heading level={4}>{t('video.recordYourShadow')}</Heading>
                </HStack>
                <Text type="supporting">{t('video.recordYourShadowHelp')}</Text>
                <VoiceRecorder
                  startLabel={t('video.startShadowRecording')}
                  stopLabel={t('video.stopShadowRecording')}
                  playLabel={t('video.playShadowRecording')}
                  downloadLabel={t('video.downloadShadowRecording')}
                  fileNamePrefix="ielts-shadowing-take"
                  onRecordingComplete={() => setRecordingCount(count => count + 1)}
                />
                <Text aria-live="polite" type="supporting">
                  {recordingCount === 0
                    ? t('video.noShadowRecording')
                    : t('video.shadowRecordingCount', { count: recordingCount })}
                </Text>
              </VStack>
            </Section>
          </Grid>

          <HStack gap={2} wrap="wrap">
            <Button
              label={t('video.previousTurn')}
              variant="secondary"
              icon={<SkipBack size={16} />}
              isDisabled={activeIndex === 0}
              onClick={() => moveToChunk(activeIndex - 1)}
            />
            <Button
              label={t('video.nextTurn')}
              variant="secondary"
              endContent={<SkipForward size={16} />}
              isDisabled={activeIndex === chunks.length - 1}
              onClick={() => moveToChunk(activeIndex + 1)}
            />
          </HStack>
        </VStack>
      </Section>

      <Section padding={4} aria-labelledby="shadowing-queue-heading">
        <VStack gap={3}>
          <Heading id="shadowing-queue-heading" level={3}>{t('video.shadowingQueue')}</Heading>
          <Text type="supporting">{t('video.shadowingQueueHelp')}</Text>
          <VStack as="ol" gap={2}>
            {chunks.map((chunk, index) => (
              <HStack as="li" key={chunk.id} gap={2} wrap="wrap" vAlign="center">
                <Button
                  label={t('video.queueTurn', { count: index + 1, timestamp: formatTimestamp(chunk.startSeconds) })}
                  variant={index === activeIndex ? 'primary' : 'ghost'}
                  size="sm"
                  aria-current={index === activeIndex ? 'step' : undefined}
                  onClick={() => moveToChunk(index)}
                />
                <Text type="supporting" maxLines={1}>{chunk.text}</Text>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Section>

      <Section variant="transparent" padding={0}>
        <VStack gap={3}>
          <Text type="label">{t('video.keyboardShortcuts')}</Text>
          <HStack gap={3} wrap="wrap">
            <HStack gap={1} vAlign="center"><Kbd keys="space" /><Text type="supporting">{t('video.shortcutPlay')}</Text></HStack>
            <HStack gap={1} vAlign="center"><Kbd keys="left" /><Kbd keys="right" /><Text type="supporting">{t('video.shortcutTurns')}</Text></HStack>
            <HStack gap={1} vAlign="center"><Kbd keys="r" /><Text type="supporting">{t('video.shortcutRate')}</Text></HStack>
          </HStack>
          <Button label={t('video.continueVocabulary')} variant="ghost" onClick={onContinue} />
        </VStack>
      </Section>
    </VStack>
  );
};
