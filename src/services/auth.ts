const defaultRedirectPath = "/dashboard";
const authRoutePrefixes = ["/sign-in", "/sign-up", "/forgot-password", "/reset-password"];

export const minimumPasswordLength = 8;

/** Returns whether the current pathname belongs to the public auth flow. */
export function isAuthRoute(pathname: string): boolean {
  return authRoutePrefixes.some((routePrefix) => {
    return pathname === routePrefix || pathname.startsWith(`${routePrefix}/`);
  });
}

/** Returns a safe in-app redirect path or falls back to the dashboard. */
export function sanitizeRedirectPath(pathname: string | null | undefined): string {
  const trimmedPathname = pathname?.trim();
  if (!trimmedPathname || !trimmedPathname.startsWith("/") || trimmedPathname.startsWith("//")) {
    return defaultRedirectPath;
  }

  if (isAuthRoute(trimmedPathname)) {
    return defaultRedirectPath;
  }

  return trimmedPathname;
}

/** Appends a safe redirect query parameter to an auth route when needed. */
export function withRedirectQuery(pathname: string, redirectPath: string): string {
  const safeRedirectPath = sanitizeRedirectPath(redirectPath);
  if (safeRedirectPath === defaultRedirectPath) {
    return pathname;
  }

  return `${pathname}?redirect=${encodeURIComponent(safeRedirectPath)}`;
}

/** Returns an auth-form validation message for password entry or null when valid. */
export function validatePassword(
  password: string,
  confirmPassword?: string,
): string | null {
  if (password.length < minimumPasswordLength) {
    return `Password must be at least ${minimumPasswordLength} characters.`;
  }

  if (typeof confirmPassword === "string" && password !== confirmPassword) {
    return "Passwords do not match.";
  }

  return null;
}

/** Returns the redirect URL used by Supabase password recovery emails. */
export function getRecoveryRedirectUrl(origin: string): string {
  return `${origin}/reset-password`;
}
