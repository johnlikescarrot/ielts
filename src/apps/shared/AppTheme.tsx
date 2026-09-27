import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import type { ReactNode } from 'react';

export function AppTheme({ children }: { children: ReactNode }) {
  return (
    <Theme theme={neutralTheme} mode="dark">
      {children}
    </Theme>
  );
}
