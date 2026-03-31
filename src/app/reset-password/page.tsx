"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/Button";
import { AuthField } from "@/components/auth/AuthField";
import { AuthMessage } from "@/components/auth/AuthMessage";
import { AuthShell } from "@/components/auth/AuthShell";
import { useAuth } from "@/context/AuthContext";
import { validatePassword } from "@/services/auth";
import { isSupabaseConfigured } from "@/services/supabase";

/** Renders the final password update page reached from a Supabase recovery link. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { isAuthReady, session, signOut, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!session) {
      setErrorMessage("Open the password recovery link from your email, then try again.");
      return;
    }

    const passwordValidationMessage = validatePassword(password, confirmPassword);
    if (passwordValidationMessage) {
      setErrorMessage(passwordValidationMessage);
      return;
    }

    setIsSubmitting(true);
    try {
      await updatePassword(password);
      await signOut();
      setSuccessMessage("Password updated. Redirecting you back to sign in.");
      router.replace(
        "/sign-in?message=Password%20updated.%20Sign%20in%20with%20your%20new%20password.",
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update your password right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const isMissingRecoverySession = isAuthReady && !session;

  return (
    <AuthShell
      description="This page only works after you open the secure recovery link sent by Supabase."
      eyebrow="New Password"
      footer={
        <p className="text-sm text-text-secondary">
          Need another email?{" "}
          <Link className="font-medium text-[var(--accent)]" href="/forgot-password">
            Request a new reset link
          </Link>
        </p>
      }
      title="Choose a new password"
    >
      <div className="flex flex-col gap-4">
        {!isSupabaseConfigured() ? (
          <AuthMessage tone="error">
            Supabase credentials are missing from `.env.local`.
          </AuthMessage>
        ) : null}
        {isMissingRecoverySession ? (
          <AuthMessage tone="info">
            Open the recovery link from your email to activate this screen.
          </AuthMessage>
        ) : null}
        {errorMessage ? <AuthMessage tone="error">{errorMessage}</AuthMessage> : null}
        {successMessage ? <AuthMessage tone="success">{successMessage}</AuthMessage> : null}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <AuthField
            autoComplete="new-password"
            label="New Password"
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
            placeholder="Repeat your new password"
            required
            type="password"
            value={confirmPassword}
          />
          <Button fullWidth isLoading={isSubmitting} loadingLabel="Saving Password..." type="submit">
            Save New Password
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
