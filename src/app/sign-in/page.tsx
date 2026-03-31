"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { sanitizeRedirectPath, withRedirectQuery } from "@/services/auth";
import { isSupabaseConfigured } from "@/services/supabase";

/** Renders the email/password sign-in page content for the shop owner. */
function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthReady, isAuthenticated, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = sanitizeRedirectPath(searchParams.get("redirect"));
  const infoMessage = searchParams.get("message");

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthReady, isAuthenticated, redirectPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to continue.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace(redirectPath);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      description="Use the shop owner account to unlock inventory, sales, sync, and the AI assistant."
      eyebrow="Sign In"
      footer={
        <p className="text-sm text-text-secondary">
          Need an account?{" "}
          <Link
            className="font-medium text-[var(--accent)]"
            href={withRedirectQuery("/sign-up", redirectPath)}
          >
            Create one
          </Link>
        </p>
      }
      title="Open your shop workspace"
    >
      <div className="flex flex-col gap-4">
        {infoMessage ? <AuthMessage tone="success">{infoMessage}</AuthMessage> : null}
        {!isSupabaseConfigured() ? (
          <AuthMessage tone="error">
            Supabase credentials are missing from `.env.local`.
          </AuthMessage>
        ) : null}
        {errorMessage ? <AuthMessage tone="error">{errorMessage}</AuthMessage> : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <AuthField
            autoComplete="email"
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@yourshop.com"
            required
            type="email"
            value={email}
          />
          <AuthField
            autoComplete="current-password"
            label="Password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
            type="password"
            value={password}
          />
          <Button fullWidth isLoading={isSubmitting} loadingLabel="Signing In..." type="submit">
            Sign In
          </Button>
        </form>

        <Link
          className="text-sm font-medium text-[var(--accent)]"
          href={withRedirectQuery("/forgot-password", redirectPath)}
        >
          Forgot your password?
        </Link>
      </div>
    </AuthShell>
  );
}

/** Renders the email/password sign-in page for the shop owner. */
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          description="Use the shop owner account to unlock inventory, sales, sync, and the AI assistant."
          eyebrow="Sign In"
          title="Open your shop workspace"
        >
          <AuthMessage tone="info">Loading sign-in...</AuthMessage>
        </AuthShell>
      }
    >
      <SignInPageContent />
    </Suspense>
  );
}
