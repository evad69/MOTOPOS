"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/Button";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext";
import {
  getRecoveryRedirectUrl,
  sanitizeRedirectPath,
  withRedirectQuery,
} from "@/services/auth";
import { isSupabaseConfigured } from "@/services/supabase";

/** Renders the password reset request page content for owner accounts. */
function ForgotPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthReady, isAuthenticated, resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = sanitizeRedirectPath(searchParams.get("redirect"));

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthReady, isAuthenticated, redirectPath, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured()) {
      setErrorMessage(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to continue.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email.trim(), getRecoveryRedirectUrl(window.location.origin));
      setSuccessMessage("Password reset link sent. Check your email to continue.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send a reset link right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      description="We will email a secure recovery link that sends you back to this app."
      eyebrow="Recovery"
      footer={
        <p className="text-sm text-text-secondary">
          Remembered it?{" "}
          <Link
            className="font-medium text-[var(--accent)]"
            href={withRedirectQuery("/sign-in", redirectPath)}
          >
            Back to sign in
          </Link>
        </p>
      }
      title="Reset your password"
    >
      <div className="flex flex-col gap-4">
        {!isSupabaseConfigured() ? (
          <AuthMessage tone="error">
            Supabase credentials are missing from `.env.local`.
          </AuthMessage>
        ) : null}
        {errorMessage ? <AuthMessage tone="error">{errorMessage}</AuthMessage> : null}
        {successMessage ? <AuthMessage tone="success">{successMessage}</AuthMessage> : null}

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
          <Button fullWidth isLoading={isSubmitting} loadingLabel="Sending Link..." type="submit">
            Send Reset Link
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

/** Renders the password reset request page for owner accounts. */
export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          description="We will email a secure recovery link that sends you back to this app."
          eyebrow="Recovery"
          title="Reset your password"
        >
          <AuthMessage tone="info">Loading password recovery...</AuthMessage>
        </AuthShell>
      }
    >
      <ForgotPasswordPageContent />
    </Suspense>
  );
}
