import type { InputHTMLAttributes } from "react";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

/** Renders a labeled auth-form input using the app's existing tokens. */
export function AuthField({ label, type = "text", ...inputProps }: AuthFieldProps) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-primary">{label}</span>
      <input
        {...inputProps}
        className="min-h-[48px] rounded-[12px] border border-[var(--border)] bg-bg-primary px-4 text-text-primary outline-none transition-colors duration-200 placeholder:text-text-secondary focus:border-[var(--accent)]"
        type={type}
      />
    </label>
  );
}
