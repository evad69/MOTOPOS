"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/services/supabase";

interface SignUpPayload {
  email: string;
  password: string;
  fullName?: string;
}

interface SignUpResult {
  requiresEmailConfirmation: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isAuthReady: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<SignUpResult>;
  resetPassword: (email: string, redirectTo: string) => Promise<void>;
  updatePassword: (nextPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Returns a readable error message from an unknown Supabase auth failure. */
function getErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}

/** Provides the global Supabase auth session and common auth actions. */
export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let isSubscribed = true;

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error("Unable to load the current auth session.", error);
        }

        if (!isSubscribed) {
          return;
        }

        setSession(data.session);
        setIsAuthReady(true);
      })
      .catch((error: unknown) => {
        console.error("Unexpected auth bootstrap failure.", error);
        if (isSubscribed) {
          setIsAuthReady(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthReady(true);
    });

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(getErrorMessage(error, "Unable to sign in right now."));
    }
  }

  async function signUp({
    email,
    password,
    fullName,
  }: SignUpPayload): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: fullName
        ? {
            data: {
              full_name: fullName,
            },
          }
        : undefined,
    });
    if (error) {
      throw new Error(getErrorMessage(error, "Unable to create your account."));
    }

    return {
      requiresEmailConfirmation: !data.session,
    };
  }

  async function resetPassword(email: string, redirectTo: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      throw new Error(getErrorMessage(error, "Unable to send a reset link right now."));
    }
  }

  async function updatePassword(nextPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    if (error) {
      throw new Error(getErrorMessage(error, "Unable to update your password right now."));
    }
  }

  async function signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(getErrorMessage(error, "Unable to sign out right now."));
    }
  }

  const contextValue: AuthContextValue = {
    session,
    user: session?.user ?? null,
    isAuthReady,
    isAuthenticated: Boolean(session),
    signIn,
    signUp,
    resetPassword,
    updatePassword,
    signOut,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/** Returns the current auth session and actions. Must be used inside AuthProvider. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
