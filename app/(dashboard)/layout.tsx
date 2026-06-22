import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { getProfileById } from "@/lib/data";
import { TopNav } from "@/components/TopNav";

// Auth gate for every dashboard route: signed out → /login, no profile → onboarding.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfileById(user.id);
  if (!profile) redirect("/onboarding");

  return (
    <>
      <TopNav
        account={{ handle: profile.handle, displayName: profile.displayName }}
      />
      {children}
    </>
  );
}
