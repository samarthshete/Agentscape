import type { ReactNode } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/data";
import { TopNav, type NavAccount } from "@/components/TopNav";

// Shared chrome for all public surfaces. Reads the session (auth is additive —
// logged out works fully) to show the right nav state.
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let account: NavAccount | null = null;
  if (user) {
    const profile = await getProfileById(user.id);
    account = {
      handle: profile?.handle ?? null,
      displayName: profile?.displayName ?? null,
    };
  }

  return (
    <>
      <TopNav account={account} />
      {children}
    </>
  );
}
