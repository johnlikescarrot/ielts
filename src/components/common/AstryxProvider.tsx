import React, { ReactNode } from "react";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";

/** Applies Astryx's accessible neutral tokens to the extension's React surfaces. */
export const AstryxProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => (
  <Theme theme={neutralTheme} mode="system">
    {children}
  </Theme>
);
