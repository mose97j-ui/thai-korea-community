import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes("your-project") &&
      !supabaseKey.startsWith("your-")
  );
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createBrowserClient(supabaseUrl!, supabaseKey!);
}

export function tryCreateClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  return createBrowserClient(supabaseUrl!, supabaseKey!);
}
