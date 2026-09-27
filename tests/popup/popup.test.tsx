import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PopupApp } from '../../src/popup/PopupApp';

describe('PopupApp Suite', () => {
  it('renders PopupApp with Word of the Day, audio trigger and launch buttons', async () => {
    render(<PopupApp />);

    expect(screen.getByText(/Word of the Day/i)).toBeInTheDocument();
    expect(screen.getByText(/Open Full Dashboard/i)).toBeInTheDocument();

    const languageToggle = screen.getByRole('button', { name: 'Switch to Vietnamese' });
    await userEvent.click(languageToggle);
    expect(screen.getByText('Từ vựng trong ngày')).toBeInTheDocument();

    // Save word in the selected locale
    const saveBtn = screen.getByText(/Thêm vào Flashcard SRS|Add to SRS Flashcards/i);
    await userEvent.click(saveBtn);
    expect(screen.getByText(/Saved to Flashcards!|Đã lưu vào bộ thẻ!/i)).toBeInTheDocument();

    // Audio button click, including the unavailable-speech fallback.
    await userEvent.click(screen.getByRole('button', { name: /Pronounce|Phát âm/i }));
    const speechSynthesis = window.speechSynthesis;
    Object.defineProperty(window, 'speechSynthesis', { writable: true, value: undefined });
    await userEvent.click(screen.getByRole('button', { name: /Pronounce|Phát âm/i }));
    Object.defineProperty(window, 'speechSynthesis', { writable: true, value: speechSynthesis });

    // Exercise the Firefox path as well as the browser fallback used in web tests.
    const createTab = vi.fn();
    (globalThis as any).browser = {
      tabs: { create: createTab },
      runtime: { getURL: (path: string) => `moz-extension://test/${path}` },
    };
    const openBtn = screen.getByText(/Open Full Dashboard|Mở bảng điều khiển đầy đủ/i);
    await userEvent.click(openBtn);
    expect(createTab).toHaveBeenCalledWith({ url: 'moz-extension://test/dashboard.html' });
    delete (globalThis as any).browser;

    // Reading quick button
    const readingBtn = screen.getByText('Reading');
    await userEvent.click(readingBtn);
  });
});
