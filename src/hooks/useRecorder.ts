import {useCallback, useRef, useState} from 'react';

export function useRecorder() {
  const recorder = useRef<MediaRecorder | undefined>(undefined);
  const stream = useRef<MediaStream | undefined>(undefined);
  const startedAt = useRef(0);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [duration, setDuration] = useState(0);

  const start = useCallback(async () => {
    const activeStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const chunks: Blob[] = [];
    const activeRecorder = new MediaRecorder(activeStream);
    activeRecorder.addEventListener('dataavailable', (event) =>
      chunks.push(event.data),
    );
    activeRecorder.addEventListener('stop', () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(
        URL.createObjectURL(new Blob(chunks, {type: activeRecorder.mimeType})),
      );
      setDuration((performance.now() - startedAt.current) / 1000);
      activeStream.getTracks().forEach((track) => track.stop());
    });
    recorder.current = activeRecorder;
    stream.current = activeStream;
    startedAt.current = performance.now();
    activeRecorder.start();
    setRecording(true);
  }, [audioUrl]);

  const stop = useCallback(() => {
    recorder.current?.stop();
    setRecording(false);
  }, []);

  return {recording, audioUrl, duration, start, stop};
}
