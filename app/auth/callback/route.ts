import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/data";

// OAuth callback: exchange the code for a session (sets HTTP-only cookies), then
// route to onboarding (no profile yet) or home.
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  const profile = await getProfileById(user.id);
  const destination = profile ? (next ?? "/") : "/onboarding";
  return NextResponse.redirect(`${origin}${destination}`);
}
