import React, { ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral';

export type AstryxMode = 'light' | 'dark' | 'system';

interface AstryxProviderProps {
  children: ReactNode;
  mode?: AstryxMode;
}

/**
 * Keeps the extension's visual language on Astryx tokens while the existing
 * skill views continue to use their local utility classes during migration.
 * Astryx ships its styles locally, so this provider never makes a network
 * request and is safe in Firefox's extension CSP.
 */
export const AstryxProvider: React.FC<AstryxProviderProps> = ({ children, mode = 'system' }) => (
  <Theme theme={neutralTheme} mode={mode}>
    {children}
  </Theme>
);
