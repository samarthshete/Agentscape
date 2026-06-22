import "server-only";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "../data/database.types";
import { requireEnv } from "./env";

// Cookie-aware server client (PUBLISHABLE key — RLS-enforced). In a request scope
// it reads/writes the user's auth cookies, so every query runs under the signed-in
// user's session (or anon when logged out). Outside a request (e.g. the seed
// script) `cookies()` throws and we fall back to a plain anon client. The secret
// key NEVER touches this path — that stays in admin.ts (seed/trusted writes only).
export async function createServerClient() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

  let store: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    store = await cookies();
  } catch {
    store = null;
  }

  if (!store) {
    return createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  const cookieStore = store;
  return createSSRServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component (cookies are read-only there) —
          // ignore; the middleware refreshes the session cookies instead.
        }
      },
    },
  });
}
