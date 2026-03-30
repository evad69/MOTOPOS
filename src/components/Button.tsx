import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { LAYOUT, RADIUS, SPACING } from "@/theme/spacing";
import { fontSizes, fontWeights } from "@/theme/typography";

type ButtonVariant = "primary" | "secondary" | "danger" | "navy";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
}

/** Returns the theme classes used by a button variant. */
function getVariantClassName(variant: ButtonVariant): string {
  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-accent text-[var(--text-on-accent)] hover:brightness-95",
    secondary:
      "border border-[var(--border)] bg-bg-surface text-text-primary hover:bg-bg-secondary",
    danger: "bg-danger text-[var(--text-on-accent)] hover:brightness-95",
    navy: "bg-accent-navy text-white hover:brightness-110",
  };

  return variantClasses[variant];
}

/** Returns the shared inline sizing styles for the base button component. */
function getButtonStyle(fullWidth: boolean, style?: CSSProperties): CSSProperties {
  return {
    minHeight: LAYOUT.minClickTarget,
    width: fullWidth ? "100%" : undefined,
    borderRadius: RADIUS.md,
    paddingInline: SPACING.lg,
    paddingBlock: SPACING.md,
    fontSize: fontSizes.button,
    fontWeight: fontWeights.semibold,
    ...style,
  };
}

/** Renders a reusable themed button with variant, loading, and disabled states. */
export function Button({
  children,
  variant = "primary",
  fullWidth = false,
  isLoading = false,
  loadingLabel = "Loading...",
  className,
  disabled,
  style,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  const classes = [
    "inline-flex items-center justify-center transition-colors duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
    "focus-visible:ring-offset-bg-primary disabled:cursor-not-allowed disabled:opacity-60",
    getVariantClassName(variant),
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...buttonProps}
      aria-busy={isLoading}
      className={classes}
      disabled={disabled || isLoading}
      style={getButtonStyle(fullWidth, style)}
      type={type}
    >
      {isLoading ? loadingLabel : children}
    </button>
  );
}
