import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShadowingStudioView } from '../../src/components/shadowing/ShadowingStudioView';
import { I18nProvider } from '../../src/i18n/i18nContext';
import { TestAttempt } from '../../src/types';
import { storageService } from '../../src/storage/storageService';

const renderStudio = () =>
  render(
    <I18nProvider>
      <ShadowingStudioView />
    </I18nProvider>
  );

const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

const originalSpeech = window.speechSynthesis;
const originalRecorder = window.MediaRecorder;

describe('ShadowingStudioView', () => {
  beforeEach(async () => {
    await storageService.resetAll();
    window.speechSynthesis = originalSpeech;
    window.MediaRecorder = originalRecorder;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.speechSynthesis = originalSpeech;
    window.MediaRecorder = originalRecorder;
  });

  it('validates setup and completes a speech session end to end', async () => {
    const user = userEvent.setup();
    renderStudio();

    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(screen.getByRole('alert')).toHaveTextContent('at least 10 English words');

    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.click(screen.getByRole('button', { name: /YouTube embed/i }));
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(screen.getByRole('alert')).toHaveTextContent('valid YouTube URL');

    await user.click(screen.getByRole('button', { name: /Local media file/i }));
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(screen.getByRole('alert')).toHaveTextContent('local audio or video file');

    await user.click(screen.getByRole('button', { name: /Speech engine/i }));
    await user.selectOptions(screen.getByLabelText('Repeat gap'), '0');
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));

    expect(screen.getByText('1 of 4')).toBeInTheDocument();
    expect(screen.getByText(/Ready — press play/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play chunk' }));
    await waitFor(
      () => expect(screen.getByText(/Session complete — nice work!/)).toBeInTheDocument(),
      { timeout: 4000 }
    );
    expect(screen.getByText('4/4')).toBeInTheDocument();

    let resolveSave: ((attempt: TestAttempt) => void) | undefined;
    const attemptSpy = vi
      .spyOn(storageService, 'addTestAttempt')
      .mockImplementation(
        () => new Promise<TestAttempt>(resolve => { resolveSave = resolve; })
      );

    await user.click(screen.getByRole('button', { name: 'Save session' }));
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    await act(async () => {
      resolveSave?.({} as TestAttempt);
    });
    expect(await screen.findByText(/Session saved to your progress history/)).toBeInTheDocument();
    expect(attemptSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        skill: 'shadowing',
        testId: 'shadowing-studio',
        rawScore: 4,
        totalQuestions: 4,
        estimatedBand: 0,
      })
    );

    await user.click(screen.getByRole('button', { name: 'New session' }));
    expect(screen.getByRole('heading', { name: 'Set up your shadowing session' })).toBeInTheDocument();
  });

  it('rejects a transcript with cues but too few words', async () => {
    const user = userEvent.setup();
    renderStudio();
    fireEvent.change(screen.getByLabelText('English transcript'), {
      target: { value: '[00:10] Hello' },
    });
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));
    expect(screen.getByRole('alert')).toHaveTextContent('at least 10 English words');
  });

  it('adjusts chunk length and auto-advance on the setup form', async () => {
    const user = userEvent.setup();
    renderStudio();

    const slider = screen.getByLabelText('Chunk length (seconds)');
    fireEvent.change(slider, { target: { value: '20' } });
    expect(screen.getByText('20s per chunk')).toBeInTheDocument();
    fireEvent.change(slider, { target: { value: '999' } });
    expect(screen.getByText('120s per chunk')).toBeInTheDocument();

    const autoAdvanceToggle = screen.getByRole('checkbox');
    await user.click(autoAdvanceToggle);
    expect(autoAdvanceToggle).not.toBeChecked();
    await user.click(autoAdvanceToggle);
    expect(autoAdvanceToggle).toBeChecked();
  });

  it('supports replay, navigation, speed cycling and keyboard shortcuts', async () => {
    const speakSpy = vi.fn();
    window.speechSynthesis = { speak: speakSpy, cancel: () => undefined } as unknown as SpeechSynthesis;

    const user = userEvent.setup();
    renderStudio();
    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));

    await user.click(screen.getByRole('button', { name: 'Play chunk' }));
    expect(speakSpy).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByText('Paused')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Play chunk' }));
    await user.click(screen.getByRole('button', { name: 'Replay chunk' }));
    expect(speakSpy).toHaveBeenCalledTimes(3);

    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('remote work also brings challenges');
    await user.click(screen.getByRole('button', { name: 'Previous chunk' }));
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent("welcome to today's discussion");
    await user.click(screen.getByRole('button', { name: 'Previous chunk' }));
    expect(speakSpy).toHaveBeenCalledTimes(6);

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    await user.click(screen.getByRole('button', { name: 'Next chunk' }));
    expect(speakSpy).toHaveBeenCalledTimes(6);
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('brings challenges');

    expect(screen.getByRole('button', { name: 'Speed 1×' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Speed 1×' }));
    expect(screen.getByRole('button', { name: 'Speed 1.25×' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'r' });
    expect(screen.getByRole('button', { name: 'Speed 1.5×' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'R' });
    expect(screen.getByRole('button', { name: 'Speed 1.75×' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'x' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('communicate clearly');
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('brings challenges');
    fireEvent.keyDown(window, { key: ' ' });
    expect(speakSpy).toHaveBeenCalledTimes(7);

    // Shortcuts are ignored while typing in form fields.
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: ' ' });
    expect(speakSpy).toHaveBeenCalledTimes(7);
    input.remove();

    await user.click(screen.getByRole('button', { name: /Over time, these habits/ }));
    expect(speakSpy).toHaveBeenCalledTimes(8);
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('Over time, these habits');
  });

  it('repeats chunks and waits between them with a countdown', async () => {
    const user = userEvent.setup();
    renderStudio();
    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.selectOptions(screen.getByLabelText('Repetitions per chunk'), '2');
    await user.selectOptions(screen.getByLabelText('Repeat gap'), '2');
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));

    await user.click(screen.getByRole('button', { name: 'Play chunk' }));

    await waitFor(
      () => expect(screen.getByText(/Your turn — next chunk in/)).toBeInTheDocument(),
      { timeout: 3000 }
    );
    expect(screen.getByText('1/4')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('2/4')).toBeInTheDocument(), { timeout: 5000 });
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('brings challenges');
  });

  it('shadows a local media file with seeking, boundary detection and take recording', async () => {
    const user = userEvent.setup();
    const file = new File(['media'], 'lesson.webm', { type: 'video/webm' });
    renderStudio();

    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.click(screen.getByRole('button', { name: /Local media file/i }));

    const fileInput = screen.getByLabelText('Local media file');
    await user.upload(fileInput, file);
    expect(screen.getByText('Selected: lesson.webm')).toBeInTheDocument();

    const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
    await user.upload(fileInput, new File(['media2'], 'lesson2.webm', { type: 'video/webm' }));
    expect(revokeSpy).toHaveBeenCalled();
    await user.upload(fileInput, []);
    expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument();
    await user.upload(fileInput, file);

    await user.selectOptions(screen.getByLabelText('Repeat gap'), '10');
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));

    const video = document.querySelector('video')!;
    const playSpy = vi.spyOn(video, 'play').mockResolvedValue(undefined);

    await user.click(screen.getByRole('button', { name: /remote work also brings challenges/ }));
    expect(video.currentTime).toBe(16);
    expect(playSpy).toHaveBeenCalledTimes(1);

    video.currentTime = 20;
    fireEvent(video, new Event('timeupdate'));
    expect(screen.getByText('0:20')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Pause' }));
    video.currentTime = 25;
    fireEvent(video, new Event('timeupdate'));
    expect(screen.getByText('Paused')).toBeInTheDocument();

    // A stale tick at the boundary while a seek is pending is ignored.
    await user.click(screen.getByRole('button', { name: 'Play chunk' }));
    video.currentTime = 32;
    fireEvent(video, new Event('timeupdate'));
    expect(screen.queryByText(/Your turn — next chunk in/)).not.toBeInTheDocument();
    video.currentTime = 17;
    fireEvent(video, new Event('timeupdate'));

    // Crossing the chunk boundary completes the chunk.
    video.currentTime = 32;
    fireEvent(video, new Event('timeupdate'));
    expect(screen.getByText(/Your turn — next chunk in/)).toBeInTheDocument();

    // The media "ended" signal also completes the chunk.
    await user.click(screen.getByRole('button', { name: 'Play chunk' }));
    fireEvent(video, new Event('ended'));
    expect(screen.getByText('2/4')).toBeInTheDocument();

    // Record two takes: one with a mimeType, one without.
    await user.click(screen.getByRole('button', { name: 'Record' }));
    await user.click(screen.getByRole('button', { name: 'Stop recording' }));
    expect(await screen.findByText(/take · chunk 2/)).toBeInTheDocument();

    class BareRecorder {
      state = 'inactive';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() {
        this.state = 'recording';
        this.ondataavailable?.({ data: new Blob(['mock']) });
      }
      stop() {
        this.state = 'inactive';
        this.onstop?.();
      }
    }
    window.MediaRecorder = BareRecorder as unknown as typeof MediaRecorder;
    await user.click(screen.getByRole('button', { name: 'Record' }));
    await user.click(screen.getByRole('button', { name: 'Stop recording' }));
    window.MediaRecorder = originalRecorder;
    expect(screen.getAllByText(/take · chunk 2/)).toHaveLength(2);

    // Play a take, including a blocked playback attempt.
    const playTakeButton = screen.getAllByRole('button', { name: 'Play take' })[0];
    await user.click(playTakeButton);
    await user.click(playTakeButton);
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValueOnce(new Error('blocked'));
    await user.click(playTakeButton);
    await wait(20);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    await user.click(screen.getAllByRole('button', { name: 'Download take' })[0]);
    expect(clickSpy).toHaveBeenCalledTimes(1);

    await user.click(screen.getAllByRole('button', { name: 'Delete take' })[0]);
    expect(screen.getAllByText(/take · chunk 2/)).toHaveLength(1);

    // Saving writes the practice attempt to the shared history.
    await user.click(screen.getByRole('button', { name: 'Save session' }));
    expect(await screen.findByText(/Session saved to your progress history/)).toBeInTheDocument();
    const history = await storageService.getTestHistory();
    expect(history[0]).toMatchObject({ skill: 'shadowing', rawScore: 2, totalQuestions: 4 });
  });

  it('controls a YouTube embed through postMessage updates', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const user = userEvent.setup();
    renderStudio();

    await user.click(screen.getByRole('button', { name: 'Try sample transcript' }));
    await user.click(screen.getByRole('button', { name: /YouTube embed/i }));
    await user.type(screen.getByLabelText('YouTube URL or video ID'), 'https://youtu.be/dQw4w9WgXcQ');
    await user.selectOptions(screen.getByLabelText('Repeat gap'), '0');
    await user.click(screen.getByRole('button', { name: 'Start shadowing' }));

    const iframe = document.querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');

    await user.click(screen.getByRole('button', { name: 'Play chunk' }));
    const postSpy = vi.spyOn(iframe.contentWindow!, 'postMessage');

    const tick = (currentTime: number) =>
      act(() => {
        window.dispatchEvent(
          new MessageEvent('message', {
            data: JSON.stringify({ event: 'infoDelivery', info: { currentTime } }),
            origin: 'https://www.youtube-nocookie.com',
          })
        );
      });

    tick(16);
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent("welcome to today's discussion");

    // Once the seek lands, updates flow and the boundary advances the chunk.
    tick(1);
    expect(screen.getByText('0:01')).toBeInTheDocument();
    tick(16);
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('brings challenges');
    expect(postSpy.mock.calls.length).toBeGreaterThan(0);

    // Malformed widget events are ignored, and the ended state advances.
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'infoDelivery' }),
          origin: 'https://www.youtube.com',
        })
      );
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'onStateChange' }),
          origin: 'https://www.youtube.com',
        })
      );
      window.dispatchEvent(
        new MessageEvent('message', {
          data: JSON.stringify({ event: 'onStateChange', info: { playerState: 0 } }),
          origin: 'https://www.youtube.com',
        })
      );
    });
    expect(screen.getByTestId('shadow-chunk-text')).toHaveTextContent('communicate clearly');

    await user.click(screen.getByRole('button', { name: 'Open chunk on YouTube' }));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=32s'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('localises the whole flow to Vietnamese', async () => {
    await storageService.updateSettings({ language: 'vi' });
    const user = userEvent.setup();
    renderStudio();

    expect(await screen.findByRole('heading', { name: /Nói theo từng đoạn/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dùng transcript mẫu' }));
    await user.selectOptions(screen.getByLabelText('Khoảng lặng để nói lại'), '0');
    await user.click(screen.getByRole('button', { name: 'Bắt đầu shadowing' }));

    expect(screen.getByText('1 / 4')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Phát đoạn' }));
    await waitFor(() => expect(screen.getByText(/Hoàn thành buổi luyện/)).toBeInTheDocument(), {
      timeout: 4000,
    });
    await user.click(screen.getByRole('button', { name: 'Buổi luyện mới' }));
    expect(screen.getByRole('heading', { name: /Thiết lập buổi luyện/i })).toBeInTheDocument();
  });
});
