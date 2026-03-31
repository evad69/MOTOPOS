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
  sanitizeRedirectPath,
  validatePassword,
  withRedirectQuery,
} from "@/services/auth";
import { isSupabaseConfigured } from "@/services/supabase";

/** Renders the account creation page content for a new shop owner. */
function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthReady, isAuthenticated, signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const passwordValidationMessage = validatePassword(password, confirmPassword);
    if (passwordValidationMessage) {
      setErrorMessage(passwordValidationMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      const { requiresEmailConfirmation } = await signUp({
        email: email.trim(),
        fullName: fullName.trim(),
        password,
      });

      if (requiresEmailConfirmation) {
        setSuccessMessage(
          "Account created. Check your email for the confirmation link, then sign in.",
        );
        return;
      }

      router.replace(redirectPath);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create your account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      description="MotoPOS is designed for one protected owner account per shop in this MVP."
      eyebrow="Sign Up"
      footer={
        <p className="text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            className="font-medium text-[var(--accent)]"
            href={withRedirectQuery("/sign-in", redirectPath)}
          >
            Sign in
          </Link>
        </p>
      }
      title="Create your owner account"
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
            autoComplete="name"
            label="Owner Name"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Juan Dela Cruz"
            value={fullName}
          />
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
            autoComplete="new-password"
            label="Password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
            type="password"
            value={password}
          />
          <AuthField
            autoComplete="new-password"
            label="Confirm Password"
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repeat your password"
            required
            type="password"
            value={confirmPassword}
          />
          <Button fullWidth isLoading={isSubmitting} loadingLabel="Creating Account..." type="submit">
            Create Account
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}

/** Renders the account creation page for a new shop owner. */
export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          description="MotoPOS is designed for one protected owner account per shop in this MVP."
          eyebrow="Sign Up"
          title="Create your owner account"
        >
          <AuthMessage tone="info">Loading sign-up...</AuthMessage>
        </AuthShell>
      }
    >
      <SignUpPageContent />
    </Suspense>
  );
}
