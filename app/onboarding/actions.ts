"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

const HANDLE_RE = /^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$/;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

// Insert the signed-in user's profile under RLS (id = auth.uid()). The unique
// handle constraint (citext) is enforced by the DB; a 23505 is shown gracefully.
export async function createProfile(formData: FormData): Promise<void> {
  const handle = String(formData.get("handle") ?? "")
    .trim()
    .toLowerCase();
  const displayName = String(formData.get("display_name") ?? "").trim();

  if (!HANDLE_RE.test(handle)) {
    redirect("/onboarding?error=invalid_handle");
  }
  if (displayName.length < 1 || displayName.length > 60) {
    redirect("/onboarding?error=invalid_name");
  }

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const avatarUrl = asString(user.user_metadata?.["avatar_url"]);

  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    handle,
    display_name: displayName,
    bio: null,
    avatar_url: avatarUrl,
  });

  if (error) {
    if (error.code === "23505") {
      redirect("/onboarding?error=handle_taken");
    }
    redirect(`/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/u/${handle}`);
}
