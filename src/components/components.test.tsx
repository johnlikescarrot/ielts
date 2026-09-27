import {useState, type ReactNode} from 'react';
import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {Theme} from '@astryxdesign/core';
import {neutralTheme} from '@astryxdesign/theme-neutral/built';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {StudyState} from '../types';
import {createInitialState} from '../lib/model';
import {translate, type CopyKey} from '../lib/i18n';
import {populatedState} from '../test/fixtures';
import {Dashboard} from './Dashboard';
import {Vocabulary} from './Vocabulary';
import {Reading} from './Reading';
import {Writing} from './Writing';
import {Speaking} from './Speaking';
import {Listening} from './Listening';
import {Settings} from './Settings';
import {QuickPanel} from './QuickPanel';

const mocks = vi.hoisted(() => ({
  captureActiveSelection: vi.fn(),
  openDashboard: vi.fn(async () => undefined),
  downloadBackup: vi.fn(),
  recorderDuration: 1.5,
}));

vi.mock('../lib/browser', () => ({
  captureActiveSelection: mocks.captureActiveSelection,
  openDashboard: mocks.openDashboard,
  downloadBackup: mocks.downloadBackup,
}));
vi.mock('../hooks/useRecorder', async () => {
  const React = await import('react');
  return {
    useRecorder: () => {
      const [recording, setRecording] = React.useState(false);
      const [audioUrl, setAudioUrl] = React.useState('');
      return {
        recording,
        audioUrl,
        duration: audioUrl ? mocks.recorderDuration : 0,
        start: async () => setRecording(true),
        stop: () => {
          setRecording(false);
          setAudioUrl('blob:recording');
        },
      };
    },
  };
});

const t = (key: CopyKey, values?: Record<string, string | number>) =>
  translate('en', key, values);

function Providers({children}: {children: ReactNode}) {
  return <Theme theme={neutralTheme}>{children}</Theme>;
}

function Stateful({
  initial = populatedState(),
  children,
}: {
  initial?: StudyState;
  children: (
    state: StudyState,
    commit: (update: (state: StudyState) => StudyState) => void,
  ) => ReactNode;
}) {
  const [state, setState] = useState(initial);
  return (
    <Providers>
      {children(state, setState)}
      <output data-testid="state">{JSON.stringify(state)}</output>
    </Providers>
  );
}

function readState(): StudyState {
  return JSON.parse(
    screen.getByTestId('state').textContent ?? '{}',
  ) as StudyState;
}

describe('dashboard and reading', () => {
  it('renders progress metrics and navigates from the plan', async () => {
    const navigate = vi.fn();
    const state = populatedState();
    state.sessions.push({
      id: 'today',
      skill: 'speaking',
      completedAt: new Date().toISOString(),
      minutes: 25,
      detail: 'today',
    });
    render(
      <Providers>
        <Dashboard state={state} t={t} onNavigate={navigate} />
      </Providers>,
    );
    expect(screen.getByRole('heading', {name: 'Today'})).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', {name: 'Review now'}));
    await userEvent.click(screen.getByRole('button', {name: 'Writing'}));
    await userEvent.click(screen.getByRole('button', {name: 'Speaking'}));
    expect(navigate.mock.calls.flat()).toEqual([
      'vocabulary',
      'writing',
      'speaking',
    ]);
  });

  it('renders empty and populated reading captures', () => {
    const {rerender} = render(
      <Providers>
        <Reading state={createInitialState()} t={t} />
      </Providers>,
    );
    expect(screen.getAllByText(/Select text on a page/)).toHaveLength(2);
    const populated = populatedState();
    populated.captures.push({
      id: 'plain',
      text: 'No metadata capture',
      sourceTitle: '',
      sourceUrl: '',
      createdAt: new Date().toISOString(),
    });
    rerender(
      <Providers>
        <Reading state={populated} t={t} />
      </Providers>,
    );
    expect(screen.getByText(/long reading passage/)).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
  });
});

describe('vocabulary', () => {
  it('adds, reveals, edits, and rates cards with mouse and keyboard', async () => {
    const user = userEvent.setup();
    render(
      <Stateful>
        {(state, commit) => <Vocabulary state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    fireEvent.keyDown(window, {code: 'Digit3'});
    expect(readState().sessions).toHaveLength(1);
    await user.click(screen.getByRole('button', {name: 'Reveal meaning'}));
    const meaning = screen.getAllByLabelText('Meaning or note')[0];
    await user.clear(meaning);
    await user.type(meaning, 'everywhere');
    await user.click(screen.getByRole('button', {name: /3 · Good/}));
    await waitFor(() =>
      expect(
        readState().cards.find((card) => card.term === 'ubiquitous')?.schedule
          .reps,
      ).toBe(1),
    );
    expect(
      readState().cards.find((card) => card.term === 'ubiquitous')?.meaning,
    ).toBe('everywhere');

    await user.type(screen.getByLabelText('Word or phrase'), 'cohesive');
    const noteInputs = screen.getAllByLabelText('Meaning or note');
    await user.type(noteInputs.at(-1)!, 'well connected');
    await user.click(screen.getByRole('button', {name: 'Save'}));
    expect(readState().cards.some((card) => card.term === 'cohesive')).toBe(
      true,
    );
  });

  it('supports shortcuts, ignores typing targets, and shows caught-up state', () => {
    const initial = populatedState();
    initial.cards.forEach((card) => {
      card.schedule.due = '2099-01-01T00:00:00.000Z';
    });
    const {rerender} = render(
      <Stateful key="future" initial={initial}>
        {(state, commit) => <Vocabulary state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    expect(screen.getByText(/caught up/)).toBeInTheDocument();
    const due = populatedState();
    rerender(
      <Stateful key="due" initial={due}>
        {(state, commit) => <Vocabulary state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    const term = screen.getByLabelText('Word or phrase');
    fireEvent.keyDown(term, {code: 'Space'});
    expect(
      screen.queryByRole('button', {name: /Again/}),
    ).not.toBeInTheDocument();
    fireEvent.keyDown(window, {code: 'Space'});
    expect(screen.getByRole('button', {name: /Again/})).toBeInTheDocument();
    fireEvent.keyDown(window, {code: 'Digit1'});
  });
});

describe('writing and speaking', () => {
  it('writes, checks criteria, changes tasks, times, and logs a response', async () => {
    vi.useFakeTimers({shouldAdvanceTime: true});
    const user = userEvent.setup({advanceTimers: vi.advanceTimersByTime});
    const initial = populatedState();
    initial.drafts.push({
      taskId: 'w-task2-workweek',
      body: 'Saved draft',
      checkedCriteria: [],
      updatedAt: new Date().toISOString(),
    });
    render(
      <Stateful initial={initial}>
        {(state, commit) => <Writing state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    const editor = screen.getByRole('textbox');
    await user.type(editor, 'A concise response with evidence.');
    await user.click(screen.getByRole('checkbox', {name: /Answer every/}));
    await user.click(screen.getByRole('checkbox', {name: /Answer every/}));
    await user.click(screen.getByRole('button', {name: 'Start timer'}));
    act(() => vi.advanceTimersByTime(901_000));
    await user.click(screen.getByRole('button', {name: 'Pause timer'}));
    fireEvent.change(screen.getByLabelText('Task'), {
      target: {value: 'missing'},
    });
    await user.selectOptions(screen.getByLabelText('Task'), 'w-task2-workweek');
    expect(screen.getByText(/four-day working week/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Log practice'}));
    expect(
      readState().sessions.some((session) => session.skill === 'writing'),
    ).toBe(true);
    vi.useRealTimers();
  });

  it('cycles speaking prompts, runs timers, records, and logs practice', async () => {
    const user = userEvent.setup();
    render(
      <Stateful>
        {(state, commit) => <Speaking state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    await user.click(screen.getByRole('button', {name: /Preparation/}));
    await user.click(screen.getByRole('button', {name: /Long turn/}));
    await user.click(screen.getByRole('button', {name: 'Next prompt'}));
    expect(screen.getByText(/place in your area/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Record answer'}));
    await waitFor(() =>
      expect(
        screen.getByRole('button', {name: 'Stop recording'}),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', {name: 'Stop recording'}));
    expect(await screen.findByText(/Recording ready/)).toBeInTheDocument();
    expect(
      readState().sessions.some((session) => session.skill === 'speaking'),
    ).toBe(true);
  });
});

describe('listening', () => {
  beforeEach(() => {
    mocks.recorderDuration = 1.5;
  });

  it('loads local files, navigates cues, loops, records, and compares timing', async () => {
    const user = userEvent.setup();
    render(
      <Stateful>
        {(state, commit) => <Listening state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    await user.click(screen.getByRole('button', {name: 'Record answer'}));
    await user.click(
      await screen.findByRole('button', {name: 'Stop recording'}),
    );
    expect(await screen.findByText(/Record an attempt/)).toBeInTheDocument();
    const [audioInput, transcriptInput] = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="file"]'),
    );
    fireEvent.change(audioInput, {target: {files: []}});
    fireEvent.change(transcriptInput, {target: {files: []}});
    const audioFile = new File(['audio'], 'sample.mp3', {type: 'audio/mpeg'});
    await user.upload(audioInput, audioFile);
    await user.upload(
      audioInput,
      new File(['audio-2'], 'sample-2.mp3', {type: 'audio/mpeg'}),
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    const transcript = new File(['cue'], 'sample.vtt', {type: 'text/vtt'});
    Object.defineProperty(transcript, 'text', {
      value: vi.fn(
        async () =>
          'WEBVTT\n\n00:00.000 --> 00:01.500\nFirst line\n\n00:02.000 --> 00:03.500\nSecond line',
      ),
    });
    await user.upload(transcriptInput, transcript);
    expect(await screen.findByText('First line')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Next'}));
    expect(screen.getByText('Second line')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Previous'}));
    const loop = screen.getByRole('checkbox', {name: 'A–B loop'});
    await user.click(loop);
    const reference = document.querySelector('audio') as HTMLAudioElement;
    fireEvent.timeUpdate(reference);
    await user.click(loop);
    Object.defineProperty(reference, 'currentTime', {
      configurable: true,
      writable: true,
      value: 2,
    });
    Object.defineProperty(reference, 'play', {
      configurable: true,
      value: vi.fn(async () => undefined),
    });
    fireEvent.timeUpdate(reference);
    await user.click(screen.getByRole('button', {name: 'Record answer'}));
    await user.click(
      await screen.findByRole('button', {name: 'Stop recording'}),
    );
    expect(await screen.findByText(/Timing is close/)).toBeInTheDocument();
    expect(
      readState().sessions.some((session) => session.skill === 'listening'),
    ).toBe(true);
  });

  it.each([
    [0.5, /shorter/],
    [3, /longer/],
  ] as const)('shows %s-second tempo guidance', async (duration, message) => {
    mocks.recorderDuration = duration;
    const user = userEvent.setup();
    render(
      <Stateful>
        {(state, commit) => <Listening state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    const transcript = new File(['cue'], 'sample.vtt');
    Object.defineProperty(transcript, 'text', {
      value: async () =>
        '00:00.000 --> 00:01.500\nLine\n\n00:02.000 --> 00:03.500\nSecond',
    });
    const transcriptInput =
      document.querySelectorAll<HTMLInputElement>('input[type="file"]')[1];
    await user.upload(transcriptInput, transcript);
    await user.click(screen.getByRole('button', {name: 'Next'}));
    await user.click(screen.getByRole('button', {name: 'Previous'}));
    await user.click(screen.getByRole('button', {name: 'Record answer'}));
    await user.click(
      await screen.findByRole('button', {name: 'Stop recording'}),
    );
    expect(await screen.findByText(message)).toBeInTheDocument();
  });
});

describe('settings and quick panel', () => {
  it('updates preferences, exports, imports, rejects bad files, and resets safely', async () => {
    const user = userEvent.setup();
    render(
      <Stateful>
        {(state, commit) => <Settings state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    await user.selectOptions(screen.getByLabelText('Language'), 'vi');
    await user.clear(screen.getByLabelText('Target band'));
    await user.type(screen.getByLabelText('Target band'), '8');
    await user.clear(screen.getByLabelText(/Daily goal/));
    await user.type(screen.getByLabelText(/Daily goal/), '30');
    await user.selectOptions(screen.getByLabelText('Theme'), 'dark');
    await user.click(screen.getByRole('button', {name: 'Import backup'}));
    await user.click(screen.getByRole('button', {name: 'Export backup'}));
    expect(mocks.downloadBackup).toHaveBeenCalled();

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {target: {files: []}});
    const bad = new File(['bad'], 'bad.json');
    Object.defineProperty(bad, 'text', {value: async () => '{bad'});
    fireEvent.change(input, {target: {files: [bad]}});
    expect(await screen.findByText(/not a valid/)).toBeInTheDocument();
    const valid = new File(['state'], 'state.json');
    Object.defineProperty(valid, 'text', {
      value: async () => JSON.stringify(createInitialState()),
    });
    fireEvent.change(input, {target: {files: [valid]}});
    expect(await screen.findByText('Backup imported.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Reset all data'}));
    await user.click(
      screen.getByRole('button', {name: 'Reset again to confirm'}),
    );
    expect(readState()).toEqual(createInitialState());
  });

  it('captures selected text, handles empty/error states, and opens the studio', async () => {
    const user = userEvent.setup();
    mocks.captureActiveSelection
      .mockResolvedValueOnce({
        text: ' selection ',
        title: 'Page',
        url: 'https://page',
      })
      .mockResolvedValueOnce({text: ' ', title: '', url: ''})
      .mockRejectedValueOnce(new Error('restricted'));
    render(
      <Stateful initial={createInitialState()}>
        {(state, commit) => <QuickPanel state={state} commit={commit} t={t} />}
      </Stateful>,
    );
    const save = screen.getByRole('button', {name: 'Save selected text'});
    await user.click(save);
    expect(await screen.findByText('Selection saved.')).toBeInTheDocument();
    expect(readState().captures).toHaveLength(1);
    await user.click(save);
    expect(await screen.findByText(/Select some text/)).toBeInTheDocument();
    await user.click(save);
    expect(await screen.findByText(/Select some text/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Open full studio'}));
    expect(mocks.openDashboard).toHaveBeenCalled();
  });
});
