"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/site";

// Start Google OAuth (PKCE). signInWithOAuth stores the code-verifier cookie via
// the server client, then we redirect the browser to Google.
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createServerClient();
  const baseUrl = await getBaseUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${baseUrl}/auth/callback` },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  if (data.url) {
    redirect(data.url);
  }
  redirect("/login?error=no_oauth_url");
}

export async function signOut(): Promise<void> {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
