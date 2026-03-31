import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient(
  getSupabaseUrl(),
  getSupabaseAnonKey()
);
