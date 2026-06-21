import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../data/database.types";
import { requireEnv } from "./env";

// Server client for the DAL's public reads. Uses the PUBLISHABLE key so RLS is
// enforced (public SELECT sees only active rows) — defense in depth even though
// the DAL also filters explicitly. No session is persisted server-side.
//
// Phase 4 (auth) will upgrade this to attach the request's auth cookie so
// owner reads/writes resolve through auth.uid(); for now there is no session.
export function createServerClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
