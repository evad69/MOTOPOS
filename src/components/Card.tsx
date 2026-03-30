import type { CSSProperties, ReactNode } from "react";
import { RADIUS, SPACING } from "@/theme/spacing";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Returns the shared inline sizing styles for the base card component. */
function getCardStyle(style?: CSSProperties): CSSProperties {
  return {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    border: "1px solid var(--border)",
    boxShadow: "0 8px 24px var(--shadow)",
    ...style,
  };
}

/** Renders a reusable surfaced card container for pages and widgets. */
export function Card({ children, className, style }: CardProps) {
  const classes = ["bg-bg-secondary", className].filter(Boolean).join(" ");

  return (
    <div className={classes} style={getCardStyle(style)}>
      {children}
    </div>
  );
}
