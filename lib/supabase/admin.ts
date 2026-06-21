import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../data/database.types";
import { requireEnv } from "./env";

// Admin client — uses the SECRET key, which BYPASSES RLS. Server-only (the
// `server-only` import makes a client bundle that pulls this in fail to build).
// Reserved for the seed and trusted server actions; never shipped to the client.
export function createAdminClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
