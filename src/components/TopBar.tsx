"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/Button";
import { useAppContext } from "@/context/AppContext";
import { RADIUS, LAYOUT, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

interface TopBarProps {
  title: string;
}

/** Returns the inline styles for the sync status dot size and shape. */
function getSyncDotStyle() {
  return {
    width: SPACING.sm,
    height: SPACING.sm,
    borderRadius: RADIUS.full,
  };
}

/** Returns the color and animation classes for the sync status dot. */
function getSyncDotClassName(isPendingSync: boolean, isSyncing: boolean): string {
  return [
    "block shrink-0",
    isPendingSync ? "bg-warning" : "bg-success",
    isSyncing ? "animate-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Returns the label shown beside the sync status dot. */
function getSyncLabel(isPendingSync: boolean, isSyncing: boolean): string {
  if (isSyncing) {
    return "Syncing";
  }

  return isPendingSync ? "Pending" : "Synced";
}

/** Renders the top page bar with title, sync indicator, and theme toggle. */
export function TopBar({ title }: TopBarProps) {
  const { isDarkMode, toggleDarkMode, isSyncing, hasPendingSync } = useAppContext();
  const syncLabel = getSyncLabel(hasPendingSync, isSyncing);

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
            <span
              aria-hidden="true"
              className={getSyncDotClassName(hasPendingSync, isSyncing)}
              style={getSyncDotStyle()}
            />
            <span>{syncLabel}</span>
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
