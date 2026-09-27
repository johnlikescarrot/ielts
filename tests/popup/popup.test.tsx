import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopupApp } from '../../src/popup/PopupApp';

describe('PopupApp Suite', () => {
  it('renders PopupApp with Word of the Day, audio trigger and launch buttons', async () => {
    render(<PopupApp />);

    expect(screen.getByText(/Word of the Day/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Full Dashboard/i)).toBeInTheDocument();

    // Save word
    const saveBtn = screen.getByText(/Add to SRS Flashcards/i);
    await userEvent.click(saveBtn);
    expect(screen.getByText(/Saved to Flashcards!/i)).toBeInTheDocument();

    // Audio button click
    const speakBtns = screen.getAllByRole('button');
    if (speakBtns.length > 0) {
      await userEvent.click(speakBtns[0]);
    }

    // Launch dashboard
    const openBtn = screen.getByText(/Open Full Dashboard/i);
    await userEvent.click(openBtn);

    // Reading quick button
    const readingBtn = screen.getByText('Reading');
    await userEvent.click(readingBtn);
  });
});
