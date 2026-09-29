import React, { useEffect, useMemo, useState } from 'react';
import { AudioLines, Captions, ChevronRight, ExternalLink, Gauge, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Kbd } from '@astryxdesign/core/Kbd';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Section } from '@astryxdesign/core/Section';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { ToggleButton } from '@astryxdesign/core/ToggleButton';
import { VStack } from '@astryxdesign/core/VStack';
import { useHotkeys } from '@astryxdesign/core/hooks';
import { useI18n } from '../../i18n/i18nContext';
import { formatTimestamp, TranscriptCue } from '../../video/videoLesson';
import {
  calculateShadowingProgress,
  createShadowingChunks,
  cycleShadowingSpeed,
  getAdjacentChunkIndex,
  SHADOWING_CHUNK_OPTIONS,
  SHADOWING_SPEED_OPTIONS,
  ShadowingChunkDuration,
  ShadowingSpeed,
} from '../../video/shadowingSession';

export interface ShadowingStudioProps {
  cues: TranscriptCue[];
  onContinue: () => void;
  onOpenAt?: (seconds: number) => void;
}

export const ShadowingStudio: React.FC<ShadowingStudioProps> = ({ cues, onContinue, onOpenAt }) => {
  const { t } = useI18n();
  const [chunkDuration, setChunkDuration] = useState<ShadowingChunkDuration>(10);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [speed, setSpeed] = useState<ShadowingSpeed>(1);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [captionsVisible, setCaptionsVisible] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reflection, setReflection] = useState('again');

  const chunks = useMemo(
    () => createShadowingChunks(cues, chunkDuration),
    [chunkDuration, cues],
  );

  const moveChunk = (direction: 'next' | 'previous') => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setCurrentChunkIndex(currentIndex => getAdjacentChunkIndex(currentIndex, direction, chunks.length));
  };

  const playCurrentChunk = () => {
    const activeChunk = chunks[currentChunkIndex];

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(activeChunk.text);
    utterance.lang = 'en-GB';
    utterance.rate = speed;
    utterance.onend = () => {
      setIsPlaying(false);
      if (autoAdvance) {
        setCurrentChunkIndex(currentIndex => getAdjacentChunkIndex(currentIndex, 'next', chunks.length));
      }
    };
    utterance.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  };

  const stopCurrentChunk = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const selectChunkDuration = (value: string) => {
    setChunkDuration(Number(value) as ShadowingChunkDuration);
    setCurrentChunkIndex(0);
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  };

  const cycleSpeed = () => setSpeed(currentSpeed => cycleShadowingSpeed(currentSpeed));

  useHotkeys([
    { keys: 'space', onPress: playCurrentChunk },
    { keys: 'left', onPress: () => moveChunk('previous') },
    { keys: 'right', onPress: () => moveChunk('next') },
    { keys: 'r', onPress: cycleSpeed },
  ]);

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  if (chunks.length === 0) {
    return (
      <Section padding={5} variant="muted">
        <VStack gap={3}>
          <Heading level={2}>{t('video.shadowTitle')}</Heading>
          <Text color="secondary">{t('video.noShadowingChunks')}</Text>
          <HStack gap={2} wrap="wrap">
            <Button label={t('video.continueToCloze')} variant="primary" onClick={onContinue} icon={<ChevronRight size={18} />} />
          </HStack>
        </VStack>
      </Section>
    );
  }

  const activeChunk = chunks[currentChunkIndex];
  const progress = calculateShadowingProgress(currentChunkIndex, chunks.length);
  const isFirstChunk = currentChunkIndex === 0;
  const isLastChunk = currentChunkIndex === chunks.length - 1;

  return (
    <Section padding={5}>
      <VStack gap={6}>
        <VStack gap={1}>
          <Heading level={2}>{t('video.shadowTitle')}</Heading>
          <Text color="secondary">{t('video.shadowHelp')}</Text>
        </VStack>

        <VStack gap={2}>
          <HStack gap={2} wrap="wrap">
            <Text type="label">{t('video.chunkSize')}</Text>
            <SegmentedControl value={String(chunkDuration)} onChange={selectChunkDuration} label={t('video.chunkSize')} size="sm">
              {SHADOWING_CHUNK_OPTIONS.map(seconds => (
                <SegmentedControlItem key={seconds} value={String(seconds)} label={`${seconds} ${t('video.seconds')}`} />
              ))}
            </SegmentedControl>
          </HStack>
          <ProgressBar
            label={t('video.shadowProgress')}
            value={progress}
            hasValueLabel
            formatValueLabel={() => `${currentChunkIndex + 1}/${chunks.length}`}
            variant={isLastChunk ? 'success' : 'accent'}
          />
        </VStack>

        <Card padding={5} variant="muted">
          <VStack gap={4}>
            <HStack gap={2} wrap="wrap">
              <AudioLines size={20} aria-hidden="true" />
              <Text type="label">{`${t('video.chunk')} ${currentChunkIndex + 1} · ${formatTimestamp(activeChunk.startSeconds)}–${formatTimestamp(activeChunk.endSeconds)}`}</Text>
              <Text color="secondary" type="supporting">{`${activeChunk.cueCount} ${t('video.captionCues')}`}</Text>
            </HStack>

            {captionsVisible ? (
              <Text type="large">{activeChunk.text}</Text>
            ) : (
              <VStack gap={1}>
                <Captions size={20} aria-hidden="true" />
                <Text color="secondary">{t('video.captionsHidden')}</Text>
              </VStack>
            )}

            <HStack gap={2} wrap="wrap">
              <Button
                label={t('video.previousChunk')}
                variant="secondary"
                isDisabled={isFirstChunk}
                onClick={() => moveChunk('previous')}
                icon={<SkipBack size={18} />}
              />
              <Button
                label={isPlaying ? t('video.stopShadowing') : t('video.replayChunk')}
                variant="primary"
                onClick={isPlaying ? stopCurrentChunk : playCurrentChunk}
                icon={isPlaying ? <RotateCcw size={18} /> : <Play size={18} />}
              />
              <Button
                label={t('video.nextChunk')}
                variant="secondary"
                isDisabled={isLastChunk}
                onClick={() => moveChunk('next')}
                icon={<SkipForward size={18} />}
              />
              {onOpenAt && (
                <Button
                  label={t('video.openVideo')}
                  variant="ghost"
                  onClick={() => onOpenAt(activeChunk.startSeconds)}
                  icon={<ExternalLink size={18} />}
                />
              )}
            </HStack>
          </VStack>
        </Card>

        <VStack gap={3}>
          <HStack gap={2} wrap="wrap">
            <Text type="label">{t('common.audioSpeed')}</Text>
            <SegmentedControl value={String(speed)} onChange={value => setSpeed(Number(value) as ShadowingSpeed)} label={t('common.audioSpeed')} size="sm">
              {SHADOWING_SPEED_OPTIONS.map(option => (
                <SegmentedControlItem key={option} value={String(option)} label={`${option}×`} icon={option === speed ? <Gauge size={14} /> : undefined} />
              ))}
            </SegmentedControl>
          </HStack>
          <HStack gap={2} wrap="wrap">
            <ToggleButton
              label={t('video.autoAdvance')}
              isPressed={autoAdvance}
              onPressedChange={setAutoAdvance}
              icon={<ChevronRight size={16} />}
              pressedIcon={<SkipForward size={16} />}
            />
            <ToggleButton
              label={t('video.showCaptions')}
              isPressed={captionsVisible}
              onPressedChange={setCaptionsVisible}
              icon={<Captions size={16} />}
            />
          </HStack>
        </VStack>

        <Section padding={4} variant="muted">
          <VStack gap={3}>
            <VStack gap={1}>
              <Heading level={3}>{t('video.selfCheck')}</Heading>
              <Text color="secondary">{t('video.selfCheckHelp')}</Text>
            </VStack>
            <SegmentedControl value={reflection} onChange={setReflection} label={t('video.selfCheck')} size="sm" layout="hug">
              <SegmentedControlItem value="again" label={t('video.needsAnotherPass')} />
              <SegmentedControlItem value="ready" label={t('video.readyForCloze')} />
            </SegmentedControl>
          </VStack>
        </Section>

        <VStack gap={2}>
          <Text type="supporting">{t('video.shortcuts')}</Text>
          <HStack gap={2} wrap="wrap">
            <Kbd keys="space" />
            <Text type="supporting">{t('video.replayChunk')}</Text>
            <Kbd keys="left" />
            <Kbd keys="right" />
            <Text type="supporting">{t('video.previousChunk')} / {t('video.nextChunk')}</Text>
            <Kbd keys="r" />
            <Text type="supporting">{t('common.audioSpeed')}</Text>
          </HStack>
        </VStack>

        <HStack gap={2} wrap="wrap">
          <Button label={t('video.continueToCloze')} variant="primary" onClick={onContinue} icon={<ChevronRight size={18} />} />
        </HStack>
      </VStack>
    </Section>
  );
};
