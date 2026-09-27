import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@astryxdesign/core/theme', () => ({
  Theme: ({ children, mode }: { children: ReactNode; mode?: string }) => (
    <div data-testid="astryx-theme" data-mode={mode ?? 'system'}>{children}</div>
  ),
}));
vi.mock('@astryxdesign/theme-neutral', () => ({ neutralTheme: { name: 'neutral' } }));

import { AstryxProvider } from '../../src/designSystem/AstryxProvider';

describe('AstryxProvider', () => {
  it('passes the bundled neutral theme and requested mode to Astryx', () => {
    render(
      <AstryxProvider mode="light">
        <p>Local theme content</p>
      </AstryxProvider>,
    );

    expect(screen.getByText('Local theme content')).toBeInTheDocument();
    expect(screen.getByTestId('astryx-theme')).toHaveAttribute('data-mode', 'light');
  });

  it('defaults to the system mode used by the extension entry points', () => {
    render(
      <AstryxProvider>
        <p>System theme content</p>
      </AstryxProvider>,
    );

    expect(screen.getByTestId('astryx-theme')).toHaveAttribute('data-mode', 'system');
  });
});
