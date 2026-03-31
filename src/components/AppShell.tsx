"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { AppProvider } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { isAuthRoute, sanitizeRedirectPath } from "@/services/auth";

interface AppShellProps {
  children: ReactNode;
}

interface StatusScreenProps {
  title: string;
  description: string;
}

/** Renders a full-screen status surface while the protected shell resolves auth state. */
function StatusScreen({ title, description }: StatusScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-primary px-6 py-10 text-text-primary">
      <div className="w-full max-w-md rounded-[18px] border border-[var(--border)] bg-bg-secondary p-8 shadow-[0_24px_60px_var(--shadow)]">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          MotoPOS
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

/** Guards the existing POS shell behind an authenticated Supabase session. */
function ProtectedShell({
  children,
  pathname,
}: AppShellProps & { pathname: string }) {
  const router = useRouter();
  const { isAuthReady, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthReady || isAuthenticated) {
      return;
    }

    const redirectPath = sanitizeRedirectPath(pathname);
    router.replace(`/sign-in?redirect=${encodeURIComponent(redirectPath)}`);
  }, [isAuthReady, isAuthenticated, pathname, router]);

  if (!isAuthReady) {
    return (
      <StatusScreen
        description="Checking your shop session before the POS loads."
        title="Loading shop session"
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <StatusScreen
        description="Your inventory, sales, and AI assistant are protected behind sign-in."
        title="Redirecting to sign in"
      />
    );
  }

  return (
    <AppProvider>
      <div className="flex min-h-screen overflow-hidden bg-bg-primary text-text-primary">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </AppProvider>
  );
}

/** Chooses between the public auth flow and the protected app shell by pathname. */
export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname() ?? "/";

  if (isAuthRoute(pathname)) {
    return <>{children}</>;
  }

  return <ProtectedShell pathname={pathname}>{children}</ProtectedShell>;
}
