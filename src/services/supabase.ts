import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const fallbackSupabaseUrl = "https://placeholder.supabase.co";
const fallbackSupabaseAnonKey = "placeholder-anon-key";

/** Returns a build-safe Supabase URL from environment variables or a fallback value. */
function getSupabaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (supabaseUrl?.startsWith("http://") || supabaseUrl?.startsWith("https://")) {
    return supabaseUrl;
  }

  return fallbackSupabaseUrl;
}

/** Returns a build-safe Supabase anon key from environment variables or a fallback value. */
function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;
}

/** Returns whether the app has real Supabase credentials configured. */
export function isSupabaseConfigured(): boolean {
  return (
    getSupabaseUrl() !== fallbackSupabaseUrl &&
    getSupabaseAnonKey() !== fallbackSupabaseAnonKey
  );
}

/** Returns a browser Supabase client with session persistence enabled. */
export const supabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
  },
});

/** Returns a request-scoped Supabase client that forwards a caller access token when provided. */
export function createSupabaseServerClient(accessToken?: string): SupabaseClient {
  return createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}
