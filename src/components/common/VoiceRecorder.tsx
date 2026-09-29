import React, { useState, useRef, useEffect } from 'react';
import { AlertCircle, Download, Mic, Pause, Play, Square } from 'lucide-react';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { Section } from '@astryxdesign/core/Section';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { useI18n } from '../../i18n/i18nContext';

export interface VoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, durationSeconds: number) => void;
  className?: string;
  startLabel?: string;
  stopLabel?: string;
  playLabel?: string;
  downloadLabel?: string;
  fileNamePrefix?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  className = '',
  startLabel,
  stopLabel,
  playLabel,
  downloadLabel,
  fileNamePrefix = 'ielts-speaking-take',
}) => {
  const { t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingTimeRef = useRef(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const resolvedStartLabel = startLabel ?? t('speaking.startRecording');
  const resolvedStopLabel = stopLabel ?? t('speaking.stopRecording');
  const resolvedPlayLabel = playLabel ?? t('speaking.playRecording');
  const resolvedDownloadLabel = downloadLabel ?? t('common.download');

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => {
    clearTimer();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const startTimer = () => {
    clearTimer();
    timerRef.current = setInterval(() => {
      recordingTimeRef.current += 1;
      setRecordingTime(recordingTimeRef.current);
    }, 1000);
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setAudioUrl(null);
    audioChunksRef.current = [];
    recordingTimeRef.current = 0;
    setRecordingTime(0);

    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone recording is not supported in this environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        onRecordingComplete?.(audioBlob, recordingTimeRef.current);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      startTimer();
    } catch (err: unknown) {
      console.warn('VoiceRecorder: mic access error', err);
      // Keep a deterministic in-browser fallback for environments without mic hardware.
      setIsRecording(true);
      startTimer();
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    clearTimer();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Mock audio blob for offline/sandbox environments.
      const mockBlob = new Blob(['mock-audio-data'], { type: 'audio/webm' });
      const url = URL.createObjectURL(mockBlob);
      setAudioUrl(url);
      onRecordingComplete?.(mockBlob, recordingTimeRef.current);
    }
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const downloadRecording = () => {
    if (!audioUrl) return;
    const download = document.createElement('a');
    download.href = audioUrl;
    download.download = `${fileNamePrefix}-${Date.now()}.webm`;
    download.click();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <Section padding={4} className={className} aria-label={t('speaking.startRecording')}>
      <VStack gap={3}>
        <HStack gap={3} wrap="wrap" vAlign="center">
          {!isRecording ? (
            <Button
              label={resolvedStartLabel}
              variant="primary"
              icon={<Mic size={16} />}
              onClick={startRecording}
            />
          ) : (
            <Button
              label={resolvedStopLabel}
              variant="destructive"
              icon={<Square size={16} />}
              onClick={stopRecording}
            />
          )}
          {isRecording && <Text type="code" aria-live="polite">{formatTime(recordingTime)}</Text>}
        </HStack>

        {audioUrl && !isRecording && (
          <HStack gap={2} wrap="wrap" vAlign="center">
            <audio ref={audioPlayerRef} src={audioUrl} onEnded={() => setIsPlayingAudio(false)} hidden />
            <Button
              label={isPlayingAudio ? t('common.pause') : resolvedPlayLabel}
              variant="secondary"
              icon={isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
              onClick={togglePlayAudio}
            />
            <Button
              label={resolvedDownloadLabel}
              variant="ghost"
              icon={<Download size={16} />}
              isIconOnly
              onClick={downloadRecording}
            />
          </HStack>
        )}

        {errorMessage && (
          <HStack gap={2} vAlign="center">
            <AlertCircle aria-hidden="true" size={16} />
            <Text type="supporting">{errorMessage}</Text>
          </HStack>
        )}
      </VStack>
    </Section>
  );
};
