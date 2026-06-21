import { createClient } from "@supabase/supabase-js";
import type { Database } from "../data/database.types";
import { requireEnv } from "./env";

// Browser client — uses the PUBLISHABLE key, which is safe in the client only
// because RLS protects every row. Never put the secret key here.
export function createBrowserClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  );
}
