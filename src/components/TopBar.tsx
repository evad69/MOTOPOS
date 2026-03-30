"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/Button";
import { RADIUS, LAYOUT, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";
import { useTheme } from "@/hooks/useTheme";

interface TopBarProps {
  title: string;
}

/** Returns the inline styles for the sync status dot. */
function getSyncDotStyle(isPendingSync: boolean) {
  return {
    width: SPACING.sm,
    height: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: isPendingSync ? "var(--warning)" : "var(--success)",
  };
}

/** Renders the top page bar with title, sync indicator, and theme toggle. */
export function TopBar({ title }: TopBarProps) {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const isPendingSync = false;

  return (
    <header
      className="sticky top-0 z-20 border-b border-[var(--border)] bg-bg-primary/95 backdrop-blur"
      style={{ minHeight: LAYOUT.topBarHeight, paddingInline: SPACING.xl }}
    >
      <div
        className="flex items-center justify-between gap-4"
        style={{ minHeight: LAYOUT.topBarHeight }}
      >
        <h1
          className="text-text-primary"
          style={{ fontSize: fontSizes.title, fontWeight: fontWeights.semibold }}
        >
          {title}
        </h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span aria-hidden="true" style={getSyncDotStyle(isPendingSync)} />
            <span>{isPendingSync ? "Pending" : "Synced"}</span>
          </div>
          <Button
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            className="gap-2"
            onClick={toggleDarkMode}
            variant="secondary"
          >
            {isDarkMode ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
            <span>{isDarkMode ? "Light" : "Dark"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
