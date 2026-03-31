import type { ReactNode } from "react";
import { Card } from "@/components/Card";

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Renders the shared split-screen surface used by every auth page. */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(29,158,117,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(26,26,46,0.18),transparent_35%),var(--bg-primary)] text-text-primary">
      <div className="grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-accent-navy px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_38%,rgba(29,158,117,0.18))]" />
          <div className="relative z-10 max-w-xl">
            <div className="text-sm font-semibold uppercase tracking-[0.28em] text-white/70">
              MotoPOS
            </div>
            <h1 className="mt-6 max-w-lg text-5xl font-semibold leading-[1.05]">
              Motorcycle parts retail, built for speed.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/72">
              Offline-first selling, reliable inventory sync, and shop insights in one focused
              workspace.
            </p>
          </div>
          <div className="relative z-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[18px] border border-white/12 bg-white/8 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">Mode</div>
              <div className="mt-3 text-lg font-semibold">Offline first</div>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Keep ringing up sales even when the connection drops.
              </p>
            </div>
            <div className="rounded-[18px] border border-white/12 bg-white/8 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">Sync</div>
              <div className="mt-3 text-lg font-semibold">Supabase-backed</div>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Products, sales, and history stay mirrored in the cloud.
              </p>
            </div>
            <div className="rounded-[18px] border border-white/12 bg-white/8 p-5 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.2em] text-white/55">Insight</div>
              <div className="mt-3 text-lg font-semibold">Gemini assistant</div>
              <p className="mt-2 text-sm leading-6 text-white/68">
                Ask about low stock, sales momentum, and reorder priorities.
              </p>
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-5 lg:hidden">
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                MotoPOS
              </div>
            </div>
            <Card className="bg-bg-secondary/96 backdrop-blur" style={{ padding: 28 }}>
              <div className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                {eyebrow}
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-text-primary">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
              <div className="mt-8">{children}</div>
              {footer ? <div className="mt-6 border-t border-[var(--border)] pt-5">{footer}</div> : null}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
