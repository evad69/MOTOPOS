import type { ReactNode } from "react";

type AuthMessageTone = "error" | "info" | "success";

interface AuthMessageProps {
  children: ReactNode;
  tone?: AuthMessageTone;
}

/** Returns the theme classes for an auth feedback banner. */
function getToneClassName(tone: AuthMessageTone): string {
  const toneClasses: Record<AuthMessageTone, string> = {
    error:
      "border-[color:rgba(226,75,74,0.35)] bg-[color:rgba(226,75,74,0.08)] text-text-primary",
    info:
      "border-[color:rgba(26,26,46,0.18)] bg-[color:rgba(26,26,46,0.05)] text-text-primary",
    success:
      "border-[color:rgba(29,158,117,0.3)] bg-[color:rgba(29,158,117,0.08)] text-text-primary",
  };

  return toneClasses[tone];
}

/** Renders a compact banner for auth errors and success states. */
export function AuthMessage({ children, tone = "info" }: AuthMessageProps) {
  return (
    <div className={`rounded-[12px] border px-4 py-3 text-sm leading-6 ${getToneClassName(tone)}`}>
      {children}
    </div>
  );
}
