import {render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it} from 'vitest';
import {App} from './App';
import {populatedState} from './test/fixtures';
import {STORAGE_KEY} from './lib/storage';

describe('App', () => {
  it('loads the dashboard and routes across every studio view', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(populatedState()));
    const {container} = render(<App surface="dashboard" />);
    expect(screen.getByText(/Loading your private/)).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', {name: 'Today'}),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Review now'}));
    expect(
      await screen.findByRole('heading', {name: 'Vocabulary'}),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', {name: 'Today'}));
    for (const [button, heading] of [
      ['Vocabulary', 'Vocabulary'],
      ['Reading', 'Reading captures'],
      ['Writing', 'Writing sprint'],
      ['Listening', 'Listening & shadowing lab'],
      ['Speaking', 'Speaking lab'],
      ['Settings', 'Settings'],
      ['Today', 'Today'],
    ]) {
      await user.click(
        screen.getByRole('button', {
          name: button === 'Vocabulary' ? /^Vocabulary/ : button,
        }),
      );
      expect(
        await screen.findByRole('heading', {name: heading}),
      ).toBeInTheDocument();
    }
    expect(container.querySelector('.studio-compact')).toBeNull();
    expect(document.documentElement.lang).toBe('en');
  });

  it('renders a compact sidebar studio', async () => {
    const {container} = render(<App surface="sidebar" />);
    await screen.findByRole('heading', {name: 'Today'});
    expect(container.querySelector('.studio-compact')).toBeInTheDocument();
  });

  it('renders the popup quick panel', async () => {
    render(<App surface="popup" />);
    await waitFor(() =>
      expect(
        screen.getByRole('heading', {name: 'Quick capture'}),
      ).toBeInTheDocument(),
    );
    expect(
      screen.getByRole('button', {name: 'Save selected text'}),
    ).toBeInTheDocument();
  });
});
