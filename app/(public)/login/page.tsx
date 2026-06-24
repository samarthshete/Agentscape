import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { signInWithGoogle } from "@/app/auth/actions";
import { Button } from "@/components/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sign in · Agentscape",
};

const ERRORS: Record<string, string> = {
  missing_code: "Sign-in was cancelled or the link expired. Try again.",
  no_user: "We couldn't read your account. Try again.",
  no_oauth_url: "Couldn't start Google sign-in. Try again.",
  too_many_attempts: "Too many sign-in attempts. Please wait a minute and try again.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  const { error } = await searchParams;
  const message = error ? (ERRORS[error] ?? error) : null;

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6">
      <h1 className="text-[26px] font-[600] tracking-[-0.02em] text-foreground">
        Sign in to Agentscape
      </h1>
      <p className="mt-2 text-[14px] leading-[1.6] text-muted">
        Sign in to claim a handle and publish your agents. Browsing the directory,
        feed, and profiles needs no account.
      </p>

      {message ? (
        <p className="mt-4 rounded-control border border-border bg-subtle px-3 py-2 font-mono text-[12px] text-foreground">
          {message}
        </p>
      ) : null}

      <form action={signInWithGoogle} className="mt-6">
        <Button type="submit" variant="primary">
          Continue with Google
        </Button>
      </form>
    </main>
  );
}
