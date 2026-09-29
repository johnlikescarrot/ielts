import React, { useEffect, useState } from 'react';
import { AspectRatio } from '@astryxdesign/core/AspectRatio';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useI18n } from '../../i18n/i18nContext';
import { LocalMediaSource } from '../../video/localMedia';

const PLAYBACK_RATES = [0.75, 0.9, 1, 1.25] as const;

interface LocalMediaPlayerProps {
  source: LocalMediaSource;
  playbackRate: number;
  mediaRef: React.RefObject<HTMLMediaElement | null>;
  onPlaybackRateChange: (rate: number) => void;
  onTimeUpdate: React.ReactEventHandler<HTMLMediaElement>;
}

export const LocalMediaPlayer: React.FC<LocalMediaPlayerProps> = ({
  source,
  playbackRate,
  mediaRef,
  onPlaybackRateChange,
  onTimeUpdate,
}) => {
  const { t } = useI18n();
  const [hasPlaybackError, setHasPlaybackError] = useState(false);

  useEffect(() => setHasPlaybackError(false), [source.url]);

  const mediaProps = {
    src: source.url,
    controls: true,
    preload: 'metadata' as const,
    onTimeUpdate,
    onError: () => setHasPlaybackError(true),
  };

  return (
    <VStack as="section" gap={3} paddingBlockEnd={5} aria-labelledby="local-player-heading">
      <VStack as="header" gap={1}>
        <Heading id="local-player-heading" level={3}>{t('video.localMediaReady')}</Heading>
        <Text type="supporting">{source.name} · {t('video.localMediaPrivate')}</Text>
      </VStack>
      {hasPlaybackError && (
        <Banner status="error" title={t('video.localMediaError')} />
      )}
      {source.kind === 'video' ? (
        <AspectRatio ratio={16 / 9} fit="contain">
          <video
            {...mediaProps}
            ref={mediaRef as React.RefObject<HTMLVideoElement | null>}
            aria-label={t('video.localVideoPlayer')}
          />
        </AspectRatio>
      ) : (
        <audio
          {...mediaProps}
          ref={mediaRef as React.RefObject<HTMLAudioElement | null>}
          aria-label={t('video.localAudioPlayer')}
          className="w-full"
        />
      )}
      <VStack gap={1}>
        <Text type="label">{t('video.playbackRate')}</Text>
        <SegmentedControl
          value={String(playbackRate)}
          onChange={value => onPlaybackRateChange(Number(value))}
          label={t('video.playbackRate')}
          size="sm"
        >
          {PLAYBACK_RATES.map(rate => (
            <SegmentedControlItem key={rate} value={String(rate)} label={`${rate}×`} />
          ))}
        </SegmentedControl>
      </VStack>
    </VStack>
  );
};
