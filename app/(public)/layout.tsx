import type { ReactNode } from "react";
import { TopNav } from "@/components/TopNav";

// Shared chrome for all public surfaces: the global top nav over page content.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <TopNav />
      {children}
    </>
  );
}
