import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";
import type { Database } from "../data/database.types";

// Browser client — PUBLISHABLE key only (safe in the client because RLS protects
// every row). Static env access so Next inlines the values into the bundle.
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY");
  }
  return createSSRBrowserClient<Database>(url, key);
}
