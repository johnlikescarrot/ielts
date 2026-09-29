import React, { useState } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalMediaPlayer } from '../../src/components/video/LocalMediaPlayer';
import { LocalSourcePicker } from '../../src/components/video/LocalSourcePicker';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { storageService } from '../../src/storage/storageService';

const PickerHarness = ({ onTranscriptLoaded = vi.fn(), onMediaFileChange = vi.fn() }) => {
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  return (
    <I18nProvider>
      <LocalSourcePicker
        subtitleFile={subtitleFile}
        mediaFile={mediaFile}
        onSubtitleFileChange={setSubtitleFile}
        onTranscriptLoaded={onTranscriptLoaded}
        onMediaFileChange={file => {
          setMediaFile(file);
          onMediaFileChange(file);
        }}
      />
    </I18nProvider>
  );
};

const withText = (file: File, text: () => Promise<string>) => {
  Object.defineProperty(file, 'text', { configurable: true, value: text });
  return file;
};

describe('local Video Lab sources', () => {
  beforeEach(async () => {
    await storageService.resetAll();
  });

  it('loads subtitle text, accepts local media, and clears both controlled inputs', async () => {
    const user = userEvent.setup();
    const onTranscriptLoaded = vi.fn();
    const onMediaFileChange = vi.fn();
    render(<PickerHarness onTranscriptLoaded={onTranscriptLoaded} onMediaFileChange={onMediaFileChange} />);

    const subtitle = withText(
      new File(['captions'], 'lesson.srt', { type: 'application/x-subrip' }),
      async () => '\uFEFF00:01 Local captions are private.',
    );
    const [subtitleInput, mediaInput] = Array.from(document.querySelectorAll<HTMLInputElement>('input[type="file"]'));
    await user.upload(subtitleInput, subtitle);
    expect(await screen.findByText(/Loaded locally: lesson.srt/)).toBeInTheDocument();
    expect(onTranscriptLoaded).toHaveBeenCalledWith('00:01 Local captions are private.');

    const audio = new File(['audio'], 'lesson.mp3', { type: 'audio/mpeg' });
    await user.upload(mediaInput, audio);
    expect(onMediaFileChange).toHaveBeenLastCalledWith(audio);

    await user.click(screen.getByRole('button', { name: 'Clear Subtitle or transcript file' }));
    expect(screen.queryByText(/Loaded locally/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear Local audio or video' }));
    expect(onMediaFileChange).toHaveBeenLastCalledWith(null);
  });

  it('reports unreadable subtitles and ignores a stale file read', async () => {
    const user = userEvent.setup();
    const onTranscriptLoaded = vi.fn();
    render(<PickerHarness onTranscriptLoaded={onTranscriptLoaded} />);
    const input = document.querySelector<HTMLInputElement>('input[type="file"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    const unreadable = withText(
      new File(['bad'], 'bad.vtt', { type: 'text/vtt' }),
      async () => { throw new Error('read failed'); },
    );
    await user.upload(input, unreadable);
    expect((await screen.findAllByText('This subtitle file could not be read. Try a UTF-8 SRT, VTT, or TXT file under 2 MB.')).length).toBeGreaterThan(0);

    let finishSlowRead: ((value: string) => void) | undefined;
    const slow = withText(
      new File(['slow'], 'slow.srt', { type: 'application/x-subrip' }),
      () => new Promise(resolve => { finishSlowRead = resolve; }),
    );
    const current = withText(
      new File(['current'], 'current.srt', { type: 'application/x-subrip' }),
      async () => '00:02 Current transcript wins safely.',
    );
    await user.upload(input, slow);
    await user.upload(input, current);
    expect(await screen.findByText(/Loaded locally: current.srt/)).toBeInTheDocument();
    finishSlowRead?.('00:01 Stale transcript must be ignored.');
    await waitFor(() => expect(onTranscriptLoaded).toHaveBeenCalledTimes(1));
    expect(onTranscriptLoaded).toHaveBeenCalledWith('00:02 Current transcript wins safely.');

    let failStaleRead: ((reason: Error) => void) | undefined;
    const staleFailure = withText(
      new File(['stale'], 'stale.vtt', { type: 'text/vtt' }),
      () => new Promise((_, reject) => { failStaleRead = reject; }),
    );
    await user.upload(input, staleFailure);
    await user.upload(input, current);
    expect(await screen.findByText(/Loaded locally: current.srt/)).toBeInTheDocument();
    await act(async () => {
      failStaleRead?.(new Error('late failure'));
      await Promise.resolve();
    });
    expect(screen.getByText(/Loaded locally: current.srt/)).toBeInTheDocument();
  });

  it('localizes source controls in Vietnamese', async () => {
    await storageService.updateSettings({ language: 'vi' });
    render(<PickerHarness />);
    expect(await screen.findByRole('heading', { name: 'Dùng tệp riêng trên thiết bị' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tệp phụ đề hoặc transcript')).toBeInTheDocument();
    expect(screen.getByLabelText('Tệp âm thanh hoặc video trên máy')).toBeInTheDocument();
  });

  it('renders audio and video players, changes speed, and surfaces decode errors', async () => {
    const user = userEvent.setup();
    const mediaRef = React.createRef<HTMLMediaElement>();
    const onPlaybackRateChange = vi.fn();
    const onTimeUpdate = vi.fn();
    const { rerender } = render(
      <I18nProvider>
        <LocalMediaPlayer
          source={{ kind: 'audio', name: 'lesson.mp3', url: 'blob:audio' }}
          playbackRate={1}
          mediaRef={mediaRef}
          onPlaybackRateChange={onPlaybackRateChange}
          onTimeUpdate={onTimeUpdate}
        />
      </I18nProvider>,
    );

    const audio = screen.getByLabelText('Local audio player');
    expect(audio).toHaveAttribute('src', 'blob:audio');
    fireEvent.timeUpdate(audio);
    expect(onTimeUpdate).toHaveBeenCalled();
    await user.click(screen.getByRole('radio', { name: '0.75×' }));
    expect(onPlaybackRateChange).toHaveBeenCalledWith(0.75);
    fireEvent.error(audio);
    expect(screen.getByText(/Firefox could not play this file/)).toBeInTheDocument();

    rerender(
      <I18nProvider>
        <LocalMediaPlayer
          source={{ kind: 'video', name: 'lesson.mp4', url: 'blob:video' }}
          playbackRate={1.25}
          mediaRef={mediaRef}
          onPlaybackRateChange={onPlaybackRateChange}
          onTimeUpdate={onTimeUpdate}
        />
      </I18nProvider>,
    );
    expect(screen.getByLabelText('Local video player')).toHaveAttribute('src', 'blob:video');
  });
});
