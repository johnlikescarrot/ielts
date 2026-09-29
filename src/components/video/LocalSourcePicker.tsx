import React, { useRef, useState } from 'react';
import { FileInput } from '@astryxdesign/core/FileInput';
import { FormLayout } from '@astryxdesign/core/FormLayout';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useI18n } from '../../i18n/i18nContext';
import { MAX_SUBTITLE_FILE_BYTES, readLocalTranscript } from '../../video/localMedia';

interface LocalSourcePickerProps {
  subtitleFile: File | null;
  mediaFile: File | null;
  onSubtitleFileChange: (file: File | null) => void;
  onTranscriptLoaded: (transcript: string) => void;
  onMediaFileChange: (file: File | null) => void;
}

type SubtitleStatus = { type: 'success' | 'error'; message: string } | undefined;

export const LocalSourcePicker: React.FC<LocalSourcePickerProps> = ({
  subtitleFile,
  mediaFile,
  onSubtitleFileChange,
  onTranscriptLoaded,
  onMediaFileChange,
}) => {
  const { t } = useI18n();
  const [subtitleStatus, setSubtitleStatus] = useState<SubtitleStatus>();
  const readRequest = useRef(0);

  const changeSubtitle = (value: File | File[] | null) => {
    const file = value instanceof File ? value : null;
    const request = ++readRequest.current;
    onSubtitleFileChange(file);
    if (!file) {
      setSubtitleStatus(undefined);
      return;
    }

    void readLocalTranscript(file)
      .then(text => {
        if (request !== readRequest.current) return;
        onTranscriptLoaded(text);
        setSubtitleStatus({ type: 'success', message: `${t('video.subtitleLoaded')} ${file.name}` });
      })
      .catch(() => {
        if (request !== readRequest.current) return;
        setSubtitleStatus({ type: 'error', message: t('video.subtitleReadError') });
      });
  };

  const changeMedia = (value: File | File[] | null) => {
    onMediaFileChange(value instanceof File ? value : null);
  };

  return (
    <VStack as="section" gap={4} paddingBlockStart={5} aria-labelledby="local-source-heading">
      <VStack as="header" gap={1}>
        <Heading id="local-source-heading" level={3}>{t('video.localSourceTitle')}</Heading>
        <Text type="supporting">{t('video.localSourceHelp')}</Text>
      </VStack>
      <FormLayout direction="horizontal">
        <FileInput
          label={t('video.subtitleFile')}
          description={t('video.subtitleFileHelp')}
          value={subtitleFile}
          onChange={changeSubtitle}
          accept=".srt,.vtt,.txt,text/plain,text/vtt,application/x-subrip"
          maxSize={MAX_SUBTITLE_FILE_BYTES}
          mode="dropzone"
          placeholder={t('video.chooseSubtitle')}
          status={subtitleStatus}
          statusVariant="detached"
          isOptional
        />
        <FileInput
          label={t('video.mediaFile')}
          description={t('video.mediaFileHelp')}
          value={mediaFile}
          onChange={changeMedia}
          accept="audio/*,video/*,.aac,.flac,.m4a,.mp3,.oga,.ogg,.opus,.wav,.m4v,.mkv,.mov,.mp4,.ogv,.webm"
          mode="dropzone"
          placeholder={t('video.chooseMedia')}
          isOptional
        />
      </FormLayout>
    </VStack>
  );
};
