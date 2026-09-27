import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopupApp } from '../../src/popup/PopupApp';
import { storageService } from '../../src/storage/storageService';

describe('PopupApp Suite', () => {
  beforeEach(async () => {
    await storageService.resetAll();
  });

  afterEach(() => {
    delete (globalThis as any).browser;
  });

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

    // Launch dashboard through window.open fallback
    const openBtn = screen.getByText(/Open Full Dashboard/i);
    await userEvent.click(openBtn);

    // Reading quick button
    const readingBtn = screen.getByText('Reading');
    await userEvent.click(readingBtn);
  });

  it('uses Firefox tabs API and Vietnamese definitions when available', async () => {
    await storageService.updateSettings({ language: 'vi', targetBand: 8.5 });
    const create = vi.fn();
    (globalThis as any).browser = {
      tabs: { create },
      runtime: { getURL: (path: string) => `moz-extension://unit/${path}` },
    };

    render(<PopupApp />);

    expect(await screen.findByText(/Band 8.5/i)).toBeInTheDocument();
    expect(screen.getByText(/Làm giảm nhẹ/i)).toBeInTheDocument();

    await userEvent.click(screen.getByText(/Open Full Dashboard/i));
    expect(create).toHaveBeenCalledWith({ url: 'moz-extension://unit/dashboard.html' });
  });
});
