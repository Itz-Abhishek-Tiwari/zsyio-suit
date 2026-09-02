import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  url = url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

  // Guard against unreplaced template placeholders (e.g. https://[PROJECT-REF].supabase.co)
  if (url.includes("[") || url.includes("]") || url.includes("<") || url.includes(">")) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    supabaseClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    return supabaseClient;
  } catch (err) {
    console.warn("[Supabase] Failed to initialize Supabase client with provided URL:", err);
    return null;
  }
}
